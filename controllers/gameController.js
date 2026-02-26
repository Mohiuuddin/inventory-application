const db = require('../db/queries');
const { body, validationResult, matchedData} = require('express-validator');

const fs = require('fs');
const path = require('path');

const validateGame = [
body('title').trim().notEmpty().withMessage('Game Title is required'),
body('release_date').isDate().withMessage('Invalid Date Format').custom((value)=>{
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate > today) {
        throw new Error('Release date cannot be in the future');
      }
      return true;
}),

body('image_url').custom((value, {req})=>{
if(!req.params.id && !req.file){
  throw new Error('Please upload an image for the game');
}
return true;
}),
body('developers').toArray().isLength({ min: 1 }).withMessage('Select at least one developer'),
body('genres').toArray().isLength({min: 1}).withMessage('Select at least one genre')


];


const validateDeveloper = [
body('name').trim().notEmpty().withMessage('Developer name is required'),
body('country').trim().notEmpty().withMessage('Country is required'),

];

const validateGenre =[
body('name').trim().notEmpty().withMessage('Genre name is required'),
];

async function game_index (req, res){
  
  const games = await db.getAllGames();
  res.render('index', {games});
}

async function get_developers(req, res) {
  const developers = await db.getAllDevelopers();
  res.render('developer', {developers});
}

async function get_genres(req, res) {
  const genres = await db.getAllGenres();
  res.render('genre', {genres});
}


async function add_game(req, res){
  try{
    const [developers, genres] = await Promise.all([
      db.getAllDevelopers(),
      db.getAllGenres()
    ]);
    res.render('forms/addGame', {developers, genres, game: null,
      gameDevs: [],
      gameGenres: []
    });
  }catch(err){
    console.error(err);
    res.status(500).send("Error loading form data");

  }
   
}


const update_game_post = [
  validateGame,
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = req.params.id;
      const { title, release_date, developers, genres } = matchedData(req);

      const devArray = Array.isArray(developers) ? developers : [developers];
      const genreArray = Array.isArray(genres) ? genres : [genres];

      let imagePath;
      const oldImagePath = req.body.existing_image;

      
      if (req.file) {
        imagePath = `/images/${req.file.filename}`;
      } else {
        imagePath = oldImagePath;
      }

      await db.updateGameWithRelations(
        id,
        title,
        release_date,
        imagePath,
        devArray,
        genreArray
      );

      
      if (req.file && oldImagePath) {
        const fullOldPath = path.join(__dirname, '../public', oldImagePath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }

      res.redirect('/');

    } catch (err) {
      console.log(err);
      res.status(500).send('Database Error');
    }
  }
];


const game_post = [
  validateGame,
  async (req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    
    try{
      const { title, release_date, developers, genres } = matchedData(req);
      
      const devArray = Array.isArray(developers)? developers : [developers];
      const genreArray = Array.isArray(genres)? genres: [genres];
      const imagePath = req.file ? `/images/${req.file.filename}` : null;
      await db.insertGameWithRelations(title, release_date, imagePath, devArray, genreArray);
      res.redirect('/');

    }catch(err){
      console.log(err);
      res.status(500).send('Database Error');
    }

  }
];


async function delete_game_post(req, res) {
  try{
        const id = req.params.id;
        const game = await db.getGameById(id);
        if(!game){
          return res.status(400).json({message: 'Game not found'});
        }
        await db.deleteGameWithRelations(id);

        if(game.image_url){
          const fullPath = path.join(__dirname, '../public', game.image_url);
          if(fs.existsSync(fullPath)){
            fs.unlinkSync(fullPath);
          }
        }

        return res.sendStatus(200);




  }catch(err){
    console.log(err);
    return res.status(500).json({message: 'Database Error'});
  }
}

function add_developer(req, res){
  res.render('forms/addDeveloper');
}


function add_genre(req, res){
  res.render('forms/addGenre');
}

const genre_post = [
  validateGenre,
  async (req, res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  } 

  const { name } = matchedData(req);
  await db.insertIntoGenres(name);
  res.redirect('/genres');

}
];


async function edit_game_get(req, res) {
  try{
      const id = req.params.id;
      const [game, developers, genres, gameDevs, gameGenres] = await Promise.all([
        db.getGameById(id),
        db.getAllDevelopers(),
        db.getAllGenres(),
        db.getGameDevelopers(id),
        db.getGameGenres(id)
      ]);

      res.render('forms/addGame', {
        game,
        developers,
        genres,
        gameDevs,
        gameGenres
      });

  }catch(err){
    console.error(err);
    res.status(500).send("Error loading edit form");
  }
}

const developer_post = [ 
  validateDeveloper,
 async (req, res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  } 

  const { name, country} = matchedData(req);
  await db.insertIntoDevelopers(name, country);
  res.redirect('/developers');

}

];

async function edit_developer_get(req, res){
  const id = req.params.id;
  const developer = await db.getDeveloperbyId(id);
  res.render('forms/addDeveloper', {developer});
}

const update_developer_post = [
  validateDeveloper,
  async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    const id = req.params.id;
    const {name, country} = matchedData(req);
    await db.updateDevelopers(id, name, country);
    res.redirect('/developers');
  }
];

async function delete_developer_post(req, res) {
  try{
    const id = req.params.id;
    await db.deleteDeveloper(id);
    res.status(200).json({ success: true });
  } catch(err){
    console.error(err);
    res.status(500).json({ success: false });
  } 
};


async function edit_genres_get(req, res) {

  const id = req.params.id;
  const genre = await db.getGenreId(id);
  res.render('forms/addGenre', {genre});
} 

const update_genres_post = [
  validateGenre,
  async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    const id = req.params.id;
    const {name} = matchedData(req);
    await db.updateGenres(id, name);
    res.redirect('/genres');
  }
];


async function delete_genre_post(req, res) {
  try{
    const id = req.params.id;
    await db.deleteGenre(id);
    res.status(200).json({ success: true });
  } catch(err){
    console.error(err);
    res.status(500).json({ success: false });
  } 
} 


module.exports = {
  game_index,
  get_developers,
  get_genres,
  add_game,
  add_developer,
  add_genre,
  developer_post,
  edit_developer_get,
  update_developer_post,
  delete_developer_post,
  genre_post,
  edit_genres_get,
  update_genres_post,
  delete_genre_post,
  game_post,
  edit_game_get,
  update_game_post,
  delete_game_post
};