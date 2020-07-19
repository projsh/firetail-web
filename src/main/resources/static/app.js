let hostnamePort = `${location.hostname}:${location.port}`;
let audio;
let currentlyPlaying = false;
let currentIndex = 0;

let titleArtist = new Vue({
    el: '.np-ctrl.metadata',
    data() {
        return {
            title: 'No song playing',
            artist: ''
        }
    }
})

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
        <li v-for="item in songs" v-bind:song="item" v-on:mouseover="hover($event)" v-on:mouseleave="leave($event)" v-on:dblclick="play(item)" :skey="item.id" :key="item.id" class="results-link">
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
            document.querySelector('.fill').style.width = '0%';
            audio.play();
            audio.addEventListener('pause', () => {
                mediaControls.playPauseIcon = 'play_arrow';
            });
            audio.addEventListener('play', () => {
                mediaControls.playPauseIcon = 'pause';
            });
            audio.addEventListener('ended', () => {
                audio.pause();
                mediaControls.skip();
            })
            currentIndex = mainSongListComp.songs.indexOf(song);
            this.updateActive();
            mediaControls.playPauseIcon = 'pause'
            titleArtist.title = song.title;
            titleArtist.artist = song.artist;
            let imgURL = `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`;
            fetch(imgURL).then(response => {
                if (response.ok) {
                    updateImg.updateBg(imgURL)
                } else {
                    updateImg.updateBg();
                }
            })
            currentlyPlaying = true;
            audio.addEventListener('timeupdate', timeUpdate);
        },
        updateActive() {
            let all = document.querySelectorAll('.results-link');
            all.forEach(f => {
                f.classList.remove('active');
                f.children[0].textContent = 'play_arrow';
                f.children[0].style.opacity = 0;
            });
            let icon = all[currentIndex].children[0]
            all[currentIndex].classList.add('active');
            icon.textContent = 'volume_up';
            icon.style.opacity = 1;
        },
        hover(evt) {
            if (evt.target.children[0]) {
                let icon = evt.target.children[0];
                icon.style.opacity = 1;
            }
        },
        leave(evt) {
            let icon = evt.target.children[0];
            if (icon.textContent != 'volume_up') {
                icon.style.opacity = 0;
            }
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
                mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
            } else {
                mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
            }
            sortArray(mainSongListComp.songs, 'artist')
        })
    })
});

Vue.component('seek-bar', {
    template:
    `<div id="seekWrapper" v-on:mousedown="down" v-on:touchstart="down" v-on:mouseover="hover" v-on:mouseleave="leave" class="np-ctrl seek">
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
    el: '.seek-container'
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

let clamp = (min, val, max) => {
    return Math.min(Math.max(min, val), max);
}

let getP = (e, el) => {
    pBar = (e.clientX - el.getBoundingClientRect().x) / el.clientWidth;
    pBar = clamp(0, pBar, 1);
    return pBar;
}

let mousetouchdown = e => {
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

let mousetouchmove = e => {
    if (!seekMouseDown) return;
    if (currentlyPlaying && seekMouseDown) {
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

let mousetouchup = e => {
    seekFillBar.style.removeProperty('transition');
    if (!seekMouseDown) return;
    if (currentlyPlaying) {
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


window.addEventListener('mousemove', e => {
    mousetouchmove(e)
});

window.addEventListener('touchmove', e => {
    mousetouchmove(e)
});

window.addEventListener('mouseup', e => {
    mousetouchup(e);
});

window.addEventListener('touchend', e => {
    mousetouchup(e);
});

let updateImg = new Vue({
    el: '.np-img',
    data() {
        return {
            bg: '/assets/no_image.svg'
        }
    },
    methods: {
        updateBg(url) {
            if (url) {
                this.bg = `background-image: url('${url}')`;
            } else {
                this.bg = `background-image: url('/assets/no_image.svg')`
            }
        }
    }
});

let updateMode = scheme => {
    let thing = document.querySelector('html').classList;
    if (scheme == 'dark') {
        thing.remove('light')
        thing.add('dark');
    } else {
        thing.remove('dark');
        thing.add('light');
    }
}

try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        updateMode('dark');
    } else {
        updateMode('light');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        updateMode(e.matches ? 'dark' : 'light');
    })
} catch(err) {}

let mediaControls = new Vue({
    el: '.media-controls',
    data() {
        return {
            playPauseIcon: 'play_arrow'
        }
    },
    methods: {
        playPause() {
            if (audio) {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        },
        skip() {
            mainSongListComp.play(mainSongListComp.songs[currentIndex + 1]);
        },
        prev() {
            mainSongListComp.play(mainSongListComp.songs[currentIndex - 1]);
        }
    }
})