const BorrowService = require('../services/circulation/borrowService');
const ReturnService = require('../services/circulation/returnService');
const RenewalService = require('../services/circulation/renewalService');

class CirculationController {
  async borrowBook(req, res) {
    try {
      const { adherentId, exemplaireId, bibliothecaireId } = req.body;
      if (!bibliothecaireId) {
        return res.status(400).json({ error: 'ID du bibliothécaire manquant' });
      }
      const result = await BorrowService.borrowBook(adherentId, exemplaireId, bibliothecaireId);
      res.json({ message: 'Livre emprunté avec succès', data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBookReturnInfo(req, res) {
    try {
      const { isbn } = req.params;
      const result = await ReturnService.getBookReturnInfo(isbn);
      res.json({ data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async returnBook(req, res) {
    try {
      const { exemplaireId } = req.body;
      const result = await ReturnService.returnBook(exemplaireId);
      res.json({ message: 'Livre retourné avec succès', data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAdherentBorrowedBooks(req, res) {
    try {
      const { numeroCarteAdherent } = req.params;
      const result = await ReturnService.getAdherentBorrowedBooks(numeroCarteAdherent);
      res.json({ data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async returnBookByExemplaireId(req, res) {
    try {
      const { exemplaireId } = req.body;
      const result = await ReturnService.returnBookByExemplaireId(exemplaireId);
      res.json({ message: 'Livre retourné avec succès', data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async renewLoan(req, res) {
    try {
      const { empruntId } = req.body;
      const result = await RenewalService.renewLoan(empruntId);
      res.json({ message: 'Emprunt renouvelé avec succès', data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOverdueLoans(req, res) {
    try {
      const result = await ReturnService.getOverdueLoans();
      res.json({ data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateOverdueLoans(req, res) {
    try {
      await ReturnService.updateOverdueLoans();
      res.json({ message: 'Mise à jour des emprunts en retard effectuée avec succès' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new CirculationController();