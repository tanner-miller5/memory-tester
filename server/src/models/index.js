const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/memory_tester', {
    dialect: 'postgres',
    logging: false,
    schema: 'public',
    define: {
        schema: 'public'
    }
});

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    // This enables automatic timestamp management
    timestamps: true,
        // You can customize the column names if needed
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
});

const Test = sequelize.define('Test', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: {  // Make sure this matches your database column name
        type: DataTypes.INTEGER,
        allowNull: false
    },
    contentType: {
        type: DataTypes.ENUM('picture', 'video'),
        allowNull: false,
        field: 'contentType'
    },
    content: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    schedule: {
        type: DataTypes.JSONB,
        allowNull: false
    }
});

const Image = sequelize.define('Image', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contentType: {
        type: DataTypes.STRING,
        defaultValue: 'image/png'
    },
    isTest: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
});

Image.associate = (models) => {
    Image.belongsTo(models.User, {
        foreignKey: 'UserId',
        as: 'creator'
    });
};


User.hasMany(Test);
Test.belongsTo(User);

module.exports = {
    sequelize,
    User,
    Test
};