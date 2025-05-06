import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../hooks-redux/store';
import { Mistral } from '@mistralai/mistralai';
import { deweyClasses } from '../../hooks-redux/type/deweyCategorie';
import AddBookForm from './AddBookForm';
import AddBookDialogs from './AddBookDialog';

interface BookInfo {
  isbn: string;
  titre: string;
  auteurs: string[];
  editeurs: string[];
  format: 'lecture sur place' | 'empruntable';
  date_publication: string;
  nombre_pages: number;
  categorie: string;
  langue: string;
  mots_cle: string[];
  numero_classe: string;
  description: string;
  url_photo: string;
  section: 'adulte' | 'jeunesse';
  nombre_exemplaires: number;
}

interface ExistingBookInfo extends BookInfo {
  nombre_exemplaires: number;
}

const initialFormData: BookInfo = {
  isbn: '',
  titre: '',
  auteurs: [],
  editeurs: [],
  format: 'empruntable',
  date_publication: '',
  nombre_pages: 0,
  categorie: '',
  langue: '',
  mots_cle: [],
  description: '',
  url_photo: '',
  numero_classe: '',
  section: 'adulte',
  nombre_exemplaires: 1,
};

const AddBook: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState<BookInfo>(initialFormData);
  const [isbnBuffer, setIsbnBuffer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBookInfo, setIsFetchingBookInfo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
  const [showExistingBookDialog, setShowExistingBookDialog] = useState(false);
  const [existingBook, setExistingBook] = useState<ExistingBookInfo | null>(null);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isbnInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [showExemplairesDialog, setShowExemplairesDialog] = useState(false);
  const [nombreExemplaires, setNombreExemplaires] = useState(1);
  const [isAddingExemplaires, setIsAddingExemplaires] = useState(false);

  const debugLog = (message: string, data?: any) => {
    console.log(`[Debug] ${message}`, data || '');
  };

  const generateKeywords = async (description: string) => {
    debugLog('Début de generateKeywords avec description:', description);

    if (!description.trim()) {
      debugLog('Description vide, annulation');
      return;
    }

    setIsGeneratingKeywords(true);
    setKeywordError(null);

    try {
      debugLog('Tentative de connexion à l\'API Mistral');
      const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

      if (!apiKey) {
        throw new Error('Clé API Mistral non trouvée');
      }

      const client = new Mistral({ apiKey });

      debugLog('Envoi de la requête à l\'API Mistral');
      const chatResponse = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: [{
          role: 'user',
          content: `Tu es un expert en bibliothèque. Génère exactement 7 mots-clés pertinents (sans les numéros) pour ce livre, séparés par des virgules. Voici la description : ${description}`,
        }],
      });

      debugLog('Réponse reçue de l\'API:', chatResponse);

      if (chatResponse.choices?.[0]?.message?.content) {
        const generatedKeywords = chatResponse.choices[0].message.content
          .split(',')
          .map(keyword => keyword.trim())
          .filter(keyword => keyword);

        debugLog('Mots-clés générés:', generatedKeywords);

        if (generatedKeywords.length > 0) {
          setFormData(prev => ({
            ...prev,
            mots_cle: generatedKeywords,
          }));
        } else {
          throw new Error('Aucun mot-clé n\'a été généré');
        }
      } else {
        throw new Error('La réponse de l\'API ne contient pas les données attendues');
      }
    } catch (err) {
      debugLog('Erreur lors de la génération des mots-clés:', err);
      setKeywordError(err instanceof Error ? err.message : 'Erreur lors de la génération des mots-clés');
    } finally {
      setIsGeneratingKeywords(false);
      debugLog('Fin de la génération des mots-clés');
    }
  };

  useEffect(() => {
    if (isbnInputRef.current) {
      isbnInputRef.current.focus();
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key >= '0' && event.key <= '9') {
        setIsbnBuffer(prev => prev + event.key);

        if (bufferTimeoutRef.current) {
          clearTimeout(bufferTimeoutRef.current);
        }

        bufferTimeoutRef.current = setTimeout(() => {
          if (isbnBuffer.length === 13) {
            handleIsbnComplete(isbnBuffer);
          }
          setIsbnBuffer('');
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [isbnBuffer]);

  const handleIsbnComplete = async (isbn: string) => {
    setFormData(prev => ({ ...prev, isbn }));
    await Promise.all([checkIsbnExists(isbn), fetchGoogleBooksInfo(isbn)]);
  };

  const fetchGoogleBooksInfo = async (isbn: string) => {
    setIsFetchingBookInfo(true);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:9999/api/book-search/search/${isbn}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des informations du livre');
      }

      const bookData = await response.json();

      if (bookData) {
        setFormData(prev => ({
          ...prev,
          titre: bookData.titre || '',
          auteurs: bookData.auteurs || [],
          editeurs: bookData.editeur ? [bookData.editeur] : [],
          date_publication: bookData.datePublication || '',
          nombre_pages: parseInt(bookData.nbPages) || 0,
          langue: bookData.langues || '',
          url_photo: bookData.images?.thumbnail || bookData.images?.small || '',
          description: bookData.description || '',
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      setMessage({
        type: 'error',
        content: 'Impossible de récupérer les informations du livre',
      });
    } finally {
      setIsFetchingBookInfo(false);
    }
  };

  const checkIsbnExists = async (isbn: string) => {
    try {
      const response = await fetch(`/api/books/search?isbn=${isbn}`);
      const data = await response.json();

      if (data.books && data.books.length > 0) {
        setExistingBook(data.books[0]);
        setShowExistingBookDialog(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'ISBN:', error);
      setMessage({
        type: 'error',
        content: 'Erreur lors de la vérification de l\'ISBN',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    debugLog(`Changement dans le champ ${name}:`, value);

    if (name === 'isbn' && (value.length === 13 || value.length === 10)) {
      handleIsbnComplete(value);
    }

    if (name === 'numero_classe') {
      handleDeweyChange(value);
      return;
    }

    if (name === 'auteurs' || name === 'editeurs' || name === 'mots_cle') {
      setFormData(prev => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim()),
      }));
    } else if (name === 'nombre_pages') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else if (name === 'date_publication') {
      const yearValue = value.trim();
      if (yearValue === '' || (yearValue.length === 4 && /^\d{4}$/.test(yearValue))) {
        setFormData(prev => ({ ...prev, [name]: yearValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDeweyChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 3);

    if (cleanValue.length === 3) {
      const deweyClass = deweyClasses.find(item => item.code === cleanValue);
      if (deweyClass) {
        setFormData(prev => ({
          ...prev,
          numero_classe: cleanValue,
          categorie: deweyClass.title,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        numero_classe: cleanValue,
        categorie: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({
        type: 'error',
        content: 'Vous devez être connecté pour ajouter un livre',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notice/livres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          livre: {
            ...formData,
            catalogueur_username: user.username,
          },
          nombreExemplaires: 1,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setExistingBook(data.book);
        setShowExistingBookDialog(true);
      } else if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement du livre');
      } else {
        setMessage({
          type: 'success',
          content: data.message || 'Livre enregistré avec succès!',
        });
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du livre',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewExemplaire = async () => {
    setIsAddingExemplaires(true);

    if (!existingBook || !existingBook.isbn) {
      setMessage({
        type: 'error',
        content: 'ISBN du livre existant non trouvé',
      });
      setIsAddingExemplaires(false);
      return;
    }

    try {
      const livreData = {
        isbn: existingBook.isbn,
        titre: existingBook.titre,
        auteurs: existingBook.auteurs,
        editeurs: existingBook.editeurs,
        format: existingBook.format,
        date_publication: existingBook.date_publication,
        nombre_pages: existingBook.nombre_pages,
        categorie: existingBook.categorie,
        langue: existingBook.langue,
        mots_cle: existingBook.mots_cle,
        description: existingBook.description,
        url_photo: existingBook.url_photo,
        numero_classe: existingBook.numero_classe,
        section: existingBook.section || 'adulte',
        nombre_exemplaires: existingBook.nombre_exemplaires,
      };

      const response = await fetch('/api/notice/livres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          livre: livreData,
          nombreExemplaires: nombreExemplaires,
          username: user?.username,
          operation: 'ajout_exemplaires',
          existingIsbn: existingBook.isbn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'ajout des exemplaires');
      }

      const data = await response.json();

      setMessage({
        type: 'success',
        content: `${nombreExemplaires} exemplaire(s) ajouté(s) avec succès!`,
      });
      setShowExemplairesDialog(false);
      setShowExistingBookDialog(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : 'Erreur lors de l\'ajout des exemplaires',
      });
    } finally {
      setIsAddingExemplaires(false);
    }
  };

  return (
    <>
      <AddBookForm
        formData={formData}
        handleInputChange={handleInputChange}
        handleGenerateKeywords={() => generateKeywords(formData.description)}
        handleSubmit={handleSubmit}
        isGeneratingKeywords={isGeneratingKeywords}
        keywordError={keywordError}
        isFetchingBookInfo={isFetchingBookInfo}
        message={message}
        isLoading={isLoading}
      />
      <AddBookDialogs
        showExistingBookDialog={showExistingBookDialog}
        setShowExistingBookDialog={setShowExistingBookDialog}
        existingBook={existingBook}
        showExemplairesDialog={showExemplairesDialog}
        setShowExemplairesDialog={setShowExemplairesDialog}
        nombreExemplaires={nombreExemplaires}
        setNombreExemplaires={setNombreExemplaires}
        isAddingExemplaires={isAddingExemplaires}
        handleAddNewExemplaire={handleAddNewExemplaire}
      />
    </>
  );
};

export default AddBook;