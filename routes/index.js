var express = require('express');
var sequelize = require('sequelize');

var router = express.Router();

var db = require('../models');
var passport = require('../config/passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.user) {
    res.redirect('/dashboard');
  }
  try {
    res.render('index', { title: '🍷 Wine Pal 🍷' });
  } catch (err) {
    console.log(err);
  }
});

router.get('/dashboard', (req, res, next) => {
  if (!req.user) {
    res.redirect(302, '../login');
  } else {
    db.Inventory.findAll({
      where: {
        userId: req.user.id,
      },
      attributes: [
        'quantity',
        'vendor',
        [sequelize.fn('sum', sequelize.col('Inventory.quantity')), 'total'],
        [sequelize.fn('sum', sequelize.col('Wine.value')), 'total_value'],
      ],
      include: [
        {
          model: db.Wine,
          as: 'Wine',
          required: true,
        },
      ],
      group: ['Inventory.wineId'],
    }).then(totals => {
      console.log(totals);
      db.Inventory.findAll({
        where: {
          userId: req.user.id,
        },
        include: [
          {
            model: db.Wine,
            as: 'Wine',
            required: true,
          },
        ],
      }).then(userWines => {
        // console.log(userWines);
        db.History.findAll({
          where: {
            userId: req.user.id,
          },
          order: [['updatedAt', 'DESC']],
          include: [
            {
              model: db.Wine,
              as: 'Wine',
              required: true,
            },
          ],
        }).then(userNotes => {
          // console.log(userNotes);
          res.render('dashboard', {
            name: req.user.name,
            email: req.user.email,
            id: req.user.id,
            userWines,
            userNotes,
            totals,
          });
        });
      });
    });
  }
});

router.get('/register', function(req, res, next) {
  try {
    res.render('register', { title: 'Registration' });
  } catch (err) {
    console.log(err);
  }
});

router.get('/login', function(req, res, next) {
  try {
    res.render('login', { title: 'Login' });
  } catch (err) {
    console.log(err);
  }
});

router.get('/wine/:id', function(req, res, next) {
  try {
    db.Inventory.findAll({
      where: {
        wineId: req.params.id,
      },
      include: [
        {
          model: db.Wine,
          as: 'Wine',
          required: true,
          include: [
            {
              model: db.History,
              as: 'Histories',
              required: false,
              where: {
                userId: req.user.id,
              },
            },
          ],
        },
      ],
    }).then(thisWine => {
      console.log(thisWine[0].dataValues);
      res.render('wine', {
        title: 'Single Wine',
        wine: thisWine[0].dataValues,
        id: req.user.id,
        name: req.user.name,
      });
    });
  } catch (err) {
    console.log(err);
  }
});
router.get('/notes/:Wine', function(req, res, next) {
  try {
    res.render('notes', { title: 'Notes', Wine: req.params.Wine });
  } catch (err) {
    console.log(err);
  }
});

router.get('/notes/:Wine', function(req, res, next) {
  res.render('notes', { title: 'Notes', Wine: req.params.Wine });
});

module.exports = router;
