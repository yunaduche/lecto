module.exports = (sequelize, DataTypes) => {
    const Adherent = sequelize.define('Adherent', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      numero_carte: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      codebarre: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      numero_telephone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      quartier: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      adresse: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      type_adhesion: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      fin_adhesion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      nombre_total_emprunts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      code_barre_exemplaire: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
        defaultValue: []
      },
      nb_retard_retour: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      titre_exemplaire: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      nombre_exemplaire_emprunte_en_cours: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      banni: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      cause_banissement: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      emprunt_en_cours_ids: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      tableName: 'adherents',
      timestamps: false, 
      indexes: [
        {
          unique: true,
          fields: ['numero_carte']
        },
        {
          unique: true,
          fields: ['codebarre']
        }
      ]
    });
  
    //associations
    Adherent.associate = (models) => {
      // 1 adherents, * emprunts
      Adherent.hasMany(models.Emprunt, {
        foreignKey: 'numero_carte',
        sourceKey: 'numero_carte'
      });
    };
  

    Adherent.beforeSave(async (adherent, options) => {
      // Verif adherents banni
      if (adherent.banni && !adherent.cause_banissement) {
        throw new Error('Une cause de banissement doit être spécifiée pour un adhérent banni');
      }
    });
  
    // mthd instanc
    Adherent.prototype.estActif = function() {
          return !this.banni && new Date(this.fin_adhesion) > new Date();
      };
  
   
    Adherent.rechercher = async function(critere) {
      return await this.findOne({
        where: {
          [Op.or]: [
            { numero_carte: critere },
            { codebarre: critere },
            { email: critere }
          ]
        }
      });
    };
  
    return Adherent;
  };