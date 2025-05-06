import React from 'react';
import { BookInfo } from './AddBook';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Book, User, Building, Calendar, Hash, Globe, Tag, Camera, FileText, Loader2 } from 'lucide-react';

interface AddBookFormProps {
  formData: BookInfo;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleGenerateKeywords: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  isGeneratingKeywords: boolean;
  keywordError: string | null;
  isFetchingBookInfo: boolean;
  message: { type: 'success' | 'error'; content: string } | null;
  isLoading: boolean;
}

const AddBookForm: React.FC<AddBookFormProps> = ({
  formData,
  handleInputChange,
  handleGenerateKeywords,
  handleSubmit,
  isGeneratingKeywords,
  keywordError,
  isFetchingBookInfo,
  message,
  isLoading,
}) => {
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-center">
          Ajouter un nouveau livre - Section {formData.section}
        </h2>
        <p className="text-sm text-gray-500 text-center">
          Scannez l'ISBN ou saisissez-le manuellement, puis complétez les informations du livre
        </p>
        {isFetchingBookInfo && (
          <div className="text-sm text-blue-500 text-center mt-2 flex items-center justify-center gap-2">
            <span className="animate-spin">⌛</span>
            Récupération des informations du livre...
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertDescription>{message.content}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Champ ISBN */}
            <div className="space-y-1">
              <Label htmlFor="isbn" className="text-sm font-medium text-gray-700">
                ISBN
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Scanner ou saisir l'ISBN"
                />
              </div>
            </div>

            {/* Champ Titre */}
            <div className="space-y-1">
              <Label htmlFor="titre" className="text-sm font-medium text-gray-700">
                Titre
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Book className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Titre du livre"
                />
              </div>
            </div>

            {/* Champ Auteurs */}
            <div className="space-y-1">
              <Label htmlFor="auteurs" className="text-sm font-medium text-gray-700">
                Auteurs
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="auteurs"
                  name="auteurs"
                  value={formData.auteurs.join(', ')}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Séparer les auteurs par des virgules"
                />
              </div>
            </div>

            {/* Champ Éditeurs */}
            <div className="space-y-1">
              <Label htmlFor="editeurs" className="text-sm font-medium text-gray-700">
                Éditeurs
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="editeurs"
                  name="editeurs"
                  value={formData.editeurs.join(', ')}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Séparer les éditeurs par des virgules"
                />
              </div>
            </div>

            {/* Champ Date de publication */}
            <div className="space-y-1">
              <Label htmlFor="date_publication" className="text-sm font-medium text-gray-700">
                Date de publication
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="date_publication"
                  name="date_publication"
                  value={formData.date_publication}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Année de publication"
                />
              </div>
            </div>

            {/* Champ Nombre de pages */}
            <div className="space-y-1">
              <Label htmlFor="nombre_pages" className="text-sm font-medium text-gray-700">
                Nombre de pages
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="number"
                  id="nombre_pages"
                  name="nombre_pages"
                  value={formData.nombre_pages}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Nombre de pages"
                />
              </div>
            </div>

            {/* Champ Langue */}
            <div className="space-y-1">
              <Label htmlFor="langue" className="text-sm font-medium text-gray-700">
                Langue
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="langue"
                  name="langue"
                  value={formData.langue}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Langue du livre"
                />
              </div>
            </div>

            {/* Champ Mots-clés */}
            <div className="space-y-1">
              <Label htmlFor="mots_cle" className="text-sm font-medium text-gray-700">
                Mots-clés
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="mots_cle"
                  name="mots_cle"
                  value={formData.mots_cle.join(', ')}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Séparer les mots-clés par des virgules"
                  disabled={isGeneratingKeywords}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerateKeywords}
                  disabled={isGeneratingKeywords || !formData.description}
                  className="mt-2"
                >
                  {isGeneratingKeywords ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    'Générer des mots-clés'
                  )}
                </Button>
              </div>
              {keywordError && (
                <p className="text-xs text-red-500 mt-1">{keywordError}</p>
              )}
            </div>

            {/* Champ URL de la photo */}
            <div className="space-y-1">
              <Label htmlFor="url_photo" className="text-sm font-medium text-gray-700">
                URL de la photo
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Camera className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="url_photo"
                  name="url_photo"
                  value={formData.url_photo}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="URL de la photo de couverture"
                />
              </div>
            </div>

            {/* Champ Numéro de classe Dewey */}
            <div className="space-y-1">
              <Label htmlFor="numero_classe" className="text-sm font-medium text-gray-700">
                Numéro de classe Dewey
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="numero_classe"
                  name="numero_classe"
                  value={formData.numero_classe}
                  onChange={handleInputChange}
                  className="pl-9 text-sm"
                  placeholder="Entrez un numéro à 3 chiffres"
                />
              </div>
            </div>

            {/* Champ Catégorie */}
            <div className="space-y-1">
              <Label htmlFor="categorie" className="text-sm font-medium text-gray-700">
                Catégorie
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Book className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="categorie"
                  name="categorie"
                  value={formData.categorie}
                  readOnly
                  className="pl-9 text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Champ Format */}
            <div className="space-y-1">
              <Label htmlFor="format" className="text-sm font-medium text-gray-700">
                Format
              </Label>
              <Select
                value={formData.format}
                onValueChange={(value: 'lecture sur place' | 'empruntable') =>
                  handleInputChange({
                    target: { name: 'format', value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empruntable">Empruntable</SelectItem>
                  <SelectItem value="lecture sur place">Lecture sur place</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Section */}
            <div className="space-y-1">
              <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                Section
              </Label>
              <Select
                value={formData.section}
                onValueChange={(value: 'adulte' | 'jeunesse') =>
                  handleInputChange({
                    target: { name: 'section', value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adulte">Adulte</SelectItem>
                  <SelectItem value="jeunesse">Jeunesse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <div className="relative">
                <div className="absolute top-2 left-2 pointer-events-none">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="pl-8 h-24 resize-none text-sm"
                  placeholder="Description du livre"
                />
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement en cours...
                </>
              ) : (
                'Enregistrer le livre'
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddBookForm;