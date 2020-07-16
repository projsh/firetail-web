let hostnamePort = `${location.hostname}:${location.port}`;
let audio;

let mainSongList = Vue.extend({
    template:
    `<div class="list-container">
        <li v-for="item in songs" v-bind:song="item" v-on:dblclick="play(item)" :skey="item.id" :key="item.id" class="results-link">
            <i class="material-icons play-pause" style="opacity: 0;">play_arrow</i>
            <div class="artist-title-album">
                <p class="list-title">{{ item.title }}</p>
                <p class="list-artist"><span>{{item.artist}}</span></p>
                <p class="list-album"><span>{{item.album}}</span></p>
            </div>
        </li>
    </div>`,
    methods: {
        play(song) {
            if (!audio) {
                audio = new Audio();
            }
            audio.src = `http://${hostnamePort}/audio/${song.fileName}`;
            audio.play();
        }
    }
});

let mainSongListComp = new mainSongList({
    data: {
        songs: []
    }
});

mainSongListComp.$mount('#mount-point');

fetch(`http://${hostnamePort}/api/getAllSongs`).then(resp => {
    resp.json().then(songs => {
        songs.forEach((f, i) => {
            mainSongListComp.songs.push({id: i, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName});
        })
    })
})