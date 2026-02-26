const pool = require('./pool');

async function getAllGames() {
  const { rows } = await pool.query(`SELECT g.*, 
           STRING_AGG(DISTINCT d.name, ', ') AS developers,
           STRING_AGG(DISTINCT gn.name, ', ') AS genres
    FROM games g
    LEFT JOIN game_developers gd ON g.id = gd.game_id
    LEFT JOIN developers d ON gd.developer_id = d.id
    LEFT JOIN game_genres gg ON g.id = gg.game_id
    LEFT JOIN genres gn ON gg.genre_id = gn.id
    GROUP BY g.id`);
  console.log(rows);
  return rows;
};

async function insertGameWithRelations(title, release_date, image_url, developers, genres) {
  const gameResult = await pool.query(`insert into games (title, release_date, image_url) values ($1, $2, $3) returning id`, [title, release_date, image_url]);

  const gameId = gameResult.rows[0].id;

  for(let devId of developers){
    await pool.query(`insert into game_developers (game_id, developer_id) values($1, $2)`, [gameId, devId]);
  }

  for(let genreId of genres){
    await pool.query(`insert into game_genres (game_id, genre_id) values($1, $2)`, [gameId, genreId]);
  }

}

async function getGameById(id) {
  const { rows } = await pool.query(`select * from games where id=$1`, [id]);
  return rows[0];
}

async function getGameDevelopers(id) {
  const { rows } = await pool.query(`select developer_id from game_developers where game_id=$1`, [id]);
  return rows.map(r => r.developer_id);
}

async function getGameGenres(id) {
  const { rows } = await pool.query(`select genre_id from game_genres where game_id=$1`, [id]);
  return rows.map(r=>r.genre_id);
}

async function updateGameWithRelations(id, title, release_date, imagePath, devArray, genreArray){
  await pool.query(`update games set title=$1, release_date=$2, image_url=$3 where id=$4`, [
    title, release_date, imagePath, id
  ]);

  await pool.query('delete from game_developers where game_id = $1', [id]);
  await pool.query('delete from game_genres where game_id = $1', [id]);

  for(let devId of devArray){
    await pool.query(`insert into game_developers (game_id, developer_id) values($1, $2)`, [
      id, devId
    ]);
  } 

  for(let genreId of genreArray){
    await pool.query(`insert into game_genres (game_id, genre_id) values($1, $2)`, [
      id, genreId
    ]);
  }

}

async function deleteGameWithRelations(id) {
    await pool.query('DELETE FROM games WHERE id = $1', [id]);
  }

async function getAllDevelopers() {
  const { rows } = await pool.query("select * from developers order by name asc");
  console.log(rows);
  return rows;
} 

async function getAllGenres() {
  const { rows } = await pool.query("select * from genres order by name asc");
  console.log(rows);
  return rows;
}

async function insertIntoDevelopers(name, country) {
  await pool.query("insert into developers (name, country) values ($1, $2)", [name, country]);
}
async function getDeveloperbyId(id) {
 const {rows} = await pool.query("select * from developers where id=$1", [id]);
 return rows[0];
}

async function updateDevelopers(id, name, country) {
  await pool.query("update developers set name=$1, country=$2 where id=$3", [name, country, id]);
  
}

async function deleteDeveloper(id) {
  await pool.query("delete from developers where id = $1", [id]);
}

async function insertIntoGenres(name) {
  await pool.query("insert into genres (name) values ($1)", [name]);
 
}

async function getGenreId(id) {
  const {rows} = await pool.query("select * from genres where id=$1", [id]);
 return rows[0];
}

async function updateGenres(id, name) {
   await pool.query("update genres set name=$1 where id=$2", [name, id]);
 
}

async function deleteGenre(id) {
    await pool.query("delete from genres where id = $1", [id]);

}

module.exports = {
  getAllGames,
  getAllDevelopers,
  getAllGenres,
  insertIntoDevelopers,
  getDeveloperbyId,
  updateDevelopers,
  deleteDeveloper,
  getGenreId,
  insertIntoGenres,
  updateGenres,
  deleteGenre,
  insertGameWithRelations,
  getGameById,
  getGameDevelopers,
  getGameGenres,
  updateGameWithRelations,
  deleteGameWithRelations
};

