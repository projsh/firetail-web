let hostnamePort = `${location.hostname}:${location.port}`;
let audio;
let currentlyPlaying = false;

let mainSongList = Vue.extend({
    template:
    `<div class="list-container">
        <div class="list-section">
        <i class="material-icons-outlined play-pause" style="visibility: hidden;">play_arrow</i>
        <div class="artist-title-album section">
            <p class="list-title">Title</p>
            <p class="list-artist">Artist</p>
            <p class="list-album">Album</p>
            <p class="list-duration">Duration</p>
        </div>
        </div>
        <li v-for="item in songs" v-bind:song="item" v-on:dblclick="play(item)" :skey="item.id" :key="item.id" class="results-link">
            <i class="material-icons-outlined play-pause" style="opacity: 0;">play_arrow</i>
            <div class="artist-title-album">
                <p class="list-title">{{ item.title }}</p>
                <p class="list-artist"><span>{{item.artist}}</span></p>
                <p class="list-album"><span>{{item.album}}</span></p>
                <p class="list-duration"><span>{{item.dur}}</span></p>
            </div>
        </li>
    </div>`,
    methods: {
        play(song) {
            if (!audio) {
                audio = new Audio();
            }
            audio.removeEventListener('timeupdate', timeUpdate);
            audio.src = `http://${hostnamePort}/audio/${song.fileName}`;
            audio.play();
            currentlyPlaying = true;
            audio.addEventListener('timeupdate', timeUpdate);
        }
    }
});

let timeUpdate = () => {
    document.querySelector('.fill').style.width = (audio.currentTime / audio.duration) * 100 + '%';
}

let sortArray = (array, sortBy) => {
    function compare(a, b) {
        if (a[sortBy].toLowerCase() < b[sortBy].toLowerCase()) return -1;
        if (a[sortBy].toLowerCase() > b[sortBy].toLowerCase()) return 1;
    }
    return array.sort(compare);
}

let mainSongListComp = new mainSongList({
    data: {
        songs: []
    }
});

mainSongListComp.$mount('#mount-point');

fetch(`http://${hostnamePort}/api/getAllSongs`).then(resp => {
    resp.json().then(songs => {
        songs.forEach((f, i) => {
            if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                mainSongListComp.songs.push({id: i, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
            } else {
                mainSongListComp.songs.push({id: i, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
            }
            sortArray(mainSongListComp.songs, 'artist')
        })
    })
});

Vue.component('seek-bar', {
    template:
    `<div id="seekWrapper" v-on:mousedown="down" v-on:mouseover="hover" v-on:mouseleave="leave" class="np-ctrl seek">
        <div class="seek-bar">
            <div class="fill"></div>
            <div class="handle"></div>
        </div>
    </div>`,
    methods: {
        down(e) {
            mousetouchdown(e);
        },
        hover() {
            document.querySelector('.handle').classList.add('handle-hover');
        },
        leave() {
            if (seekMouseDown) return;
            document.querySelector('.handle').classList.remove('handle-hover')
        }
    }
});

new Vue({
    el: '.np-ctrls'
})

let seekBar;
let seekBarWrapper;
let seekFillBar;
setTimeout(() => {
    seekBar = document.querySelector('.seek-bar');
    seekBarWrapper = document.querySelector('#seekWrapper');
    seekFillBar = document.querySelector('.fill');
}, 50)
let seekMouseDown = false;

function clamp(min, val, max) {
    return Math.min(Math.max(min, val), max);
}

function getP(e, el) {
    pBar = (e.clientX - el.getBoundingClientRect().x) / el.clientWidth;
    pBar = clamp(0, pBar, 1);
    return pBar;
}

function mousetouchdown(e) {
    if (currentlyPlaying) {
        if (e.touches) {
            e = e.touches[0]
        }
        seekMouseDown = true;
        pBar = getP(e, seekBar);
        seekFillBar.style.width = pBar * 100 + '%';
        audio.removeEventListener('timeupdate', timeUpdate);
        document.querySelector('.handle').classList.add('handle-hover')
    }
}

function mousetouchmove(e) {
    if (!seekMouseDown) return;
    if (currentlyPlaying) {
        if (seekMouseDown) {
            seekFillBar.style.transition = 'none';
            if (e.touches) {
                e = e.touches[0]
            }
            pBar = getP(e, seekBar);
            seekFillBar.style.width = pBar * 100 + '%';
            minutes = Math.floor((pBar * audio.duration) / 60);
            seconds = Math.floor((pBar * audio.duration) / 1);
            while (seconds >= 60) {
                seconds = seconds - 60;
            }
            if (seconds > -1 && seconds < 10) {
                seconds = ('0' + seconds).slice(-2);
            }
            //document.querySelector('#songDurationTime').innerHTML = `${minutes}:${seconds}`
        }
    }
}

function mousetouchup(e) {
    seekFillBar.style.removeProperty('transition');
    if (!seekMouseDown) return;
    if (currentlyPlaying) {
        if (seekMouseDown) {
            if (e.changedTouches) {
                e = e.changedTouches[0]
            }
            seekMouseDown = false;
            pBar = getP(e, seekBar);
            seekFillBar.style.width = pBar * 100 + '%';
            audio.currentTime = pBar * audio.duration;
            audio.addEventListener('timeupdate', timeUpdate);
            document.querySelector('.handle').classList.remove('handle-hover')
        }
    }
}

window.addEventListener('mousemove', function (e) {
    mousetouchmove(e)
});

window.addEventListener('touchmove', function (e) {
    mousetouchmove(e)
});

window.addEventListener('mouseup', function (e) {
    mousetouchup(e);
});

window.addEventListener('touchend', function (e) {
    mousetouchup(e);
});