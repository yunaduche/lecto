const { DataTypes } = require('sequelize');

const LogEventType = DataTypes.ENUM('modification_livre', 'suppression_livre', 'suppression_exemplaire', 'ouverture_session_acquisition', 'fermeture_session_acquisition', 'emprunt', 'retour', 'renouvellement'); //actions à exploiter dans le frontentd, typéé

module.exports = (sequelize) => {
    const BibliothequeLog = sequelize.define('BibliothequeLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        event_type: {
            type: LogEventType,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        details: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        livre_titre: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        exemplaire_titre: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        session_nom: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'bibliotheque_logs',
        timestamps: false,
        underscored: true
    });

    return BibliothequeLog;
};