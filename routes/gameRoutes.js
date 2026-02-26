const express = require('express');
const router = express.Router();;
const gameController = require('../controllers/gameController')

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');  // 👈 store inside public/images
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.get('/', gameController.game_index );

router.get('/games/add', gameController.add_game);
router.post('/games/add', upload.single('image_url'), gameController.game_post);
router.get('/games/:id/edit', gameController. edit_game_get);
router.post('/games/:id/edit', upload.single('image_url'), gameController.update_game_post);
router.post('/games/:id/delete', gameController.delete_game_post);

router.get('/developers', gameController.get_developers);

router.get('/developers/add', gameController.add_developer);
router.post('/developers/add', gameController.developer_post);
router.get('/developers/:id/edit', gameController.edit_developer_get);
router.post('/developers/:id/edit', gameController.update_developer_post);
router.post('/developers/:id/delete', gameController.delete_developer_post);


router.get('/genres', gameController.get_genres);
router.get('/genres/add', gameController.add_genre);
router.post('/genres/add', gameController.genre_post);

router.get('/genres/:id/edit', gameController.edit_genres_get);
router.post('/genres/:id/edit', gameController.update_genres_post);
router.post('/genres/:id/delete', gameController.delete_genre_post);


module.exports = router;