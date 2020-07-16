let mainSongList = Vue.extend({
    template:
    `<div>
        <li v-for="item in songs" v-bind:song="item" v-bind:key="item.id" class="results-link">
            <i class="material-icons play-pause" style="opacity: 0;">play_arrow</i>
            <div class="artist-title-album">
                <p class="list-title">{{ item.title }}</p>
                <p class="list-artist"><span>{{item.artist}}</span></p>
                <p class="list-album"><span>{{item.album}}</span></p>
            </div>
        </li>
    </div>`
});

let mainSongListComp = new mainSongList({
    el: ".results-link",
    data: {
        songs: [
            {id: 0, title: "test", artist: "test artist", album: "album test"},
            {id: 1, title: "test", artist: "test artist", album: "album test"},
            {id: 2, title: "test", artist: "test artist", album: "album test"},
            {id: 3, title: "test", artist: "test artist", album: "album test"},
            {id: 4, title: "test", artist: "test artist", album: "album test"},
            {id: 5, title: "test", artist: "test artist", album: "album test"},
            {id: 6, title: "test", artist: "test artist", album: "album test"},
            {id: 7, title: "test", artist: "test artist", album: "album test"},
        ]
    }
});

mainSongListComp.$mount('#mount-point')