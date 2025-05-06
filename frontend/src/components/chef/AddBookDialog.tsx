import React from 'react';
import { ExistingBookInfo } from './ActiveSessionCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddBookDialogsProps {
  showExistingBookDialog: boolean;
  setShowExistingBookDialog: (show: boolean) => void;
  existingBook: ExistingBookInfo | null;
  showExemplairesDialog: boolean;
  setShowExemplairesDialog: (show: boolean) => void;
  nombreExemplaires: number;
  setNombreExemplaires: (value: number) => void;
  isAddingExemplaires: boolean;
  handleAddNewExemplaire: () => void;
}

const AddBookDialogs: React.FC<AddBookDialogsProps> = ({
  showExistingBookDialog,
  setShowExistingBookDialog,
  existingBook,
  showExemplairesDialog,
  setShowExemplairesDialog,
  nombreExemplaires,
  setNombreExemplaires,
  isAddingExemplaires,
  handleAddNewExemplaire
}) => {
  return (
    <>
      <AlertDialog open={showExistingBookDialog} onOpenChange={setShowExistingBookDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Livre déjà existant</AlertDialogTitle>
            <AlertDialogDescription>
              {existingBook && (
                <div className="space-y-2">
                  <p>Un livre avec cet ISBN existe déjà dans la bibliothèque :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Titre : {existingBook.titre}</li>
                    <li>ISBN : {existingBook.isbn}</li>
                    <li>Auteurs : {existingBook.auteurs.join(', ')}</li>
                    <li>Nombre d'exemplaires : {existingBook.nombre_exemplaires}</li>
                    <li>Section : {existingBook.section}</li>
                  </ul>
                  <p>Voulez-vous ajouter des exemplaires ?</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowExemplairesDialog(true);
              setShowExistingBookDialog(false);
            }}>
              Ajouter des exemplaires
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showExemplairesDialog} onOpenChange={setShowExemplairesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des exemplaires</DialogTitle>
            <DialogDescription>
              Spécifiez le nombre d'exemplaires à ajouter pour ce livre
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombreExemplaires">Nombre d'exemplaires</Label>
              <Input
                id="nombreExemplaires"
                type="number"
                min="1"
                max="100"
                value={nombreExemplaires}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0) {
                    setNombreExemplaires(value);
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExemplairesDialog(false);
                setNombreExemplaires(1);
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAddNewExemplaire}
              disabled={isAddingExemplaires || nombreExemplaires < 1}
            >
              {isAddingExemplaires ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddBookDialogs;