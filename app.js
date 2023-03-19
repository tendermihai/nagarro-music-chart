const musicTopElement = document.querySelector(".music-top__items");
const formElement = document.querySelector("#music-form");
const containerElement = document.querySelector(".music-top-container");

class Song {
  constructor({ name, artist, initialVotes, album, id }) {
    this.name = name;
    this.artist = artist;
    this.initialVotes = initialVotes || 0;
    this.#votes = this.initialVotes;
    this.album = album;
    this.id = id || this.getUniqueId();
    this.#entryTopDate = new Date();
  }

  #votes;

  #entryTopDate;

  vote() {
    this.#votes++;
    this.initialVotes++;
  }

  getUniqueId() {
    return Math.floor(Math.random() * Date.now());
  }

  get votes() {
    return this.#votes;
  }

  get entryTopDate() {
    return this.#entryTopDate;
  }
}

const songs = [];

// ======= fetch json db =======
function getSongs(url) {
  fetch(url)
    .then((response) => response.json())
    .then((songsData) => {
      if (songsData.length) {
        songsData.forEach((song) => {
          const { artist, name, initialVotes, album, id } = song;

          songs.push(
            new Song({
              artist,
              name,
              initialVotes,
              album,
              id,
            })
          );
        });

        const musicTop = new MusicTop(songs);

        renderSongs(musicTop.getTop());

        containerElement.addEventListener("click", (ev) => {
          if ("vote" in ev.target.dataset) {
            const currentSong = songs.find(
              (song) => song.id == ev.target.dataset.vote
            );
            currentSong.vote();
            console.log(
              `voted for ${currentSong.name} by ${currentSong.artist}. Votes: ${currentSong.votes}`
            );
            // const musicTopElement = document.querySelector(`.music-top__newItem[data-id="${currentSong.id}"]`);
            // musicTopElement.innerHTML = new HtmlSong(currentSong).getHtml(); // replace only current song's html content

            renderSongs(new MusicTop(songs).getTop()); // generate all html content (sort again after voting)
          }
        });

        // Add song to top
        formElement.addEventListener("submit", (event) => {
          event.preventDefault();
          const artist = document.getElementById("artist").value;
          const name = document.getElementById("song").value;
          const songInstance = new Song({
            artist,
            name,
          });

          musicTop.addSong(songInstance);
          renderSongs(musicTop.getTop());

          postSong(songInstance);

          formElement.reset();
        });
      } else {
        musicTopElement.innerHTML = "No Songs found";
      }
    })
    .catch((error) => console.log("error: ", error.message));
}

let url = `https://my-json-server.typicode.com/lucianpopa84/mysongsserver/songs`; // using https://my-json-server.typicode.com and https://github.com/lucianpopa84/mysongsserver

url = `https://mysongsserver.herokuapp.com/songs`; // deployed with Heroku https://elements.heroku.com/buttons/eecs130/json-server-heroku

getSongs(url);

class MusicTop {
  constructor(songs) {
    this.songs = songs;
  }

  addSong(song) {
    this.songs.push(song);
  }

  getTop() {
    return this.songs
      .sort((a, b) => {
        if (a.votes === b.votes) {
          return b.entryTopDate - a.entryTopDate;
        }
        return b.votes - a.votes;
      })
      .slice(0, 10);
  }
}

class HtmlSong extends Song {
  getHtml() {
    return `<div class="music-top__newItem" data-id="${this.id}">
              <p>${this.name}</p> <p>${this.artist}</p> <p>Votes: ${this.votes}</p>
              <section class="my-song-buttons">
              <button class="vote-button" data-vote="${this.id}">Vote</button> 
              <button class="delete-button" data-delete="${this.id}">Delete</button>
              <button class="edit-button" data-edit="${this.id}" onclick="editButtonClicked(${this.id})">Edit</button>
              </section></div>
              `;
  }
}

containerElement.addEventListener("click", (ev) => {
  if ("vote" in ev.target.dataset) {
    // ...
  } else if ("delete" in ev.target.dataset) {
    const currentSong = songs.find(
      (song) => song.id == ev.target.dataset.delete
    );
    fetch(`${url}/${currentSong.id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          songs.splice(songs.indexOf(currentSong), 1);
          renderSongs(new MusicTop(songs).getTop());
        }
      })
      .catch((error) => console.log("error: ", error.message));
  }
});

const renderSongs = (songs) => {
  musicTopElement.innerHTML = "";

  songs.forEach((song) => {
    musicTopElement.insertAdjacentHTML(
      "beforeend",
      new HtmlSong(song).getHtml()
    );
  });
};

const postSong = (song) => {
  fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(song), // body data type must match "Content-Type" header
  })
    .then((response) => response.json())
    .then((resp) => {
      console.log(`${resp.name} by ${resp.artist} added.`, resp);
      alert(`${resp.name} by ${resp.artist} added to db.`);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.querySelector(".search-button");
  searchButton.addEventListener("click", () => {
    event.preventDefault();
    const nameInput = document.getElementById("artist");
    const songInput = document.getElementById("song");
    const nameValue = nameInput.value;
    const songValue = songInput.value;

    let url = "https://mysongsserver.herokuapp.com/songs";
    if (nameValue !== "" || songValue !== "") {
      url += "?";
      if (nameValue !== "") {
        url += `artist_like=${nameValue}&`;
      }
      if (songValue !== "") {
        url += `name_like=${songValue}&`;
      }
      // Remove the last '&' character from the url
      url = url.slice(0, -1);
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const songsList = document.querySelector(".music-top__items");
        songsList.innerHTML = "";

        data.forEach((song) => {
          const htmlSong = new HtmlSong(song);
          songsList.innerHTML += htmlSong.getHtml();
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
let songID;
function editButtonClicked(id) {
  const nameInput = document.getElementById("name-input");
  const artistInput = document.getElementById("artist-input");
  const song = songs.find((song) => song.id === id);
  songID = song.id;
  nameInput.value = song.name;
  artistInput.value = song.artist;
}

function applyButtonClicked() {
  const nameInput = document.getElementById("name-input");
  const artistInput = document.getElementById("artist-input");
  const patchURL = `${url}/${songID}`;
  const data = { name: nameInput.value, artist: artistInput.value };
  const options = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  fetch(patchURL, options)
    .then((response) => response.json())
    .then((updatedSong) => {
      const index = songs.findIndex((song) => song.id === updatedSong.id);
      songs[index] = updatedSong;
      renderSongs(songs);
      nameInput.value = "";
      artistInput.value = "";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
