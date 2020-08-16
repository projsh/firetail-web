let hostnamePort = `${location.hostname}:${location.port}`;
let audio;
let currentlyPlaying = false;
let currentIndex = 0;
let queue = [];
let currentView = "All Songs";
let currentPlayingView = "All Songs";
let currentSong;

let titleArtist = new Vue({
    el: '.np-ctrl.metadata',
    data() {
        return {
            title: 'No song playing',
            artist: ''
        }
    }
});

let htmlClass = document.querySelector('html').classList;

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

if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'system');
}

if (!localStorage.getItem('scheme')) {
    localStorage.setItem('scheme', 'firetail');
}

switch(localStorage.getItem('scheme')) {
    case "firetail":
        htmlClass.add('firetail');
        break;
    case "purple":
        htmlClass.add('purple');
        break;
    case "green":
        htmlClass.add('green');
        break;
    default:
        htmlClass.add('firetail');
}

if (localStorage.getItem('theme') == 'dark') {
    updateMode('dark');
} else if (localStorage.getItem('theme') == 'light') {
    updateMode('light');
}

try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('theme') == 'system') {
        updateMode('dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches && localStorage.getItem('theme') == 'system') {
        updateMode('light');
    } else if (localStorage.getItem('theme') == 'system') {
        updateMode('dark');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('theme') == 'system') {
            updateMode(e.matches ? 'dark' : 'light');
        }
    })
} catch(err) {}


let touch = false;
window.addEventListener('pointerover', evt => {
    if (evt.pointerType == 'touch') {
        touch = true;
        document.querySelector('.handle').classList.add('handle-hover')
    } else {
        touch = false;
        document.querySelector('.handle').classList.remove('handle-hover')
    }
});

let shuffle = (array) => {
    return array.sort(() => Math.random() - 0.5);
}

let mediaControls = new Vue({
    el: '.media-controls',
    data() {
        return {
            playPauseIcon: 'play_arrow',
            shuffleEnabled: false
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
            if (queue[currentIndex + 1] == undefined) {
                mainSongListComp.play(queue[0], false, false, true);
            } else {
                mainSongListComp.play(queue[currentIndex + 1], false, false, true);
            }
        },
        prev() {
            if (audio.currentTime < 3) {
                if (queue[currentIndex - 1] == undefined) {
                    mainSongListComp.play(queue[queue.length - 1], false, false, true);
                } else {
                    mainSongListComp.play(queue[currentIndex - 1], false, false, true);
                }
            } else {
                audio.currentTime = 0;
            }
        },
        shuffle(evt) {
            if (!this.shuffleEnabled) {
                shuffle(queue);
                this.shuffleEnabled = true;
                evt.target.classList.add('active');
                currentIndex = queue.indexOf(currentSong);
            } else {
                sortArray(queue, 'artist');
                this.shuffleEnabled = false;
                evt.target.classList.remove('active');
            }
        },
        repeat(evt) {
            if (!this.repeatEnabled) {
                evt.target.classList.add('active');
                this.repeatEnabled = true;
            } else {
                evt.target.classList.remove('active');
                this.repeatEnabled = false;
            }
        }
    }
})

Vue.component('song-list', {
    props: ['song'],
    template:
    `<li v-on:contextmenu="ctxMenu($event); highlight($event, song);" v-on:mouseover="hover($event)" v-on:mouseleave="leave($event)" v-on:dblclick="play(song, false, true, false)" v-on:click="play(song, true, true, false, $event)" class="results-link">
        <i class="material-icons-outlined play-pause" style="opacity: 0;">play_arrow</i>
        <div class="artist-title-album">
            <p class="list-title">{{ song.title }}</p>
            <p class="list-artist" v-on:click="getArtist"><span>{{song.artist}}</span></p>
            <p class="list-album" v-on:click="getAlbum"><span>{{song.album}}</span></p>
            <p class="list-duration"><span>{{song.duration}}</span></p>
        </div>
    </li>`,
    methods: {
        getArtist() {
            let artist = this.song.artist;
            if (mountedTab != null) {
                mountedTab.$destroy;
                document.querySelector('.tab-container').innerHTML = '';
            }
            mainSongListComp = new mainSongList({
                data: {
                    songs: []
                }
            });
            fetch(`http://${hostnamePort}/api/artists/get?artist=${encodeURIComponent(artist)}`).then(resp => {
                resp.json().then(async songs => {
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    });
                    updateListOrder('album')
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs';
                    currentView = `artist-${artist}`;
                    mainSongListComp.$mount('.tab-container')
                    tabName.title = artist;
                    tabName.showButtons(false, null, null, null, true, true);
                    updateActive();
                    mountedTab = mainSongListComp;
                    document.querySelectorAll('.side-click').forEach(f => {
                        f.classList.remove('active');
                    });
                    let artistTabBtn = document.querySelector('#artistsTab');
                    artistTabBtn.classList.add('active');
                    let indicator = document.querySelector('.active-indicator');
                    indicator.style.height = artistTabBtn.getBoundingClientRect().height + 'px';
                    indicator.style.top = artistTabBtn.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
                })
            })
        },
        getAlbum() {
            let artist = this.song.artist;
            let album = this.song.album;
            fetch(`http://${hostnamePort}/api/albums/get?album=${encodeURIComponent(album)}`).then(resp => {
                resp.json().then(songs => {
                    if (mountedTab != null) {
                        mountedTab.$destroy;
                        document.querySelector('.tab-container').innerHTML = '';
                    }
                    mainSongListComp = new mainSongList({
                        data: {
                            songs: []
                        }
                    });
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    });
                    updateListOrder('title')
                    tabName.showButtons(true, album, artist, null, true, true);
                    tabName.title = album;
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs';
                    currentView = `album-${album}`;
                    mainSongListComp.$mount('.tab-container');
                    if (currentIndex) {
                        updateActive();
                    }
                    mountedTab = mainSongListComp;
                    document.querySelectorAll('.side-click').forEach(f => {
                        f.classList.remove('active');
                    });
                    let albumTabBtn = document.querySelector('#albumsTab');
                    albumTabBtn.classList.add('active');
                    let indicator = document.querySelector('.active-indicator');
                    indicator.style.height = albumTabBtn.getBoundingClientRect().height + 'px';
                    indicator.style.top = albumTabBtn.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
                })
            })
        },
        play(song, isTouch, newQueue, curView, evt) {
            mainSongListComp.play(song, isTouch, newQueue, curView, evt);
        },
        updateActive() {
            updateActive();
        },
        highlight(e, song) {
            mainSongListComp.highlight(e, song);
        },
        ctxMenu(e) {
            mainSongListComp.ctxMenu(e);
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
})

let updateActive = () => {
    try {
        if (currentView == currentPlayingView) {
            let findSong;
            mainSongListComp.songs.forEach((f, i) => {
                if (f.artist == currentSong.artist && f.title == currentSong.title && f.album == currentSong.album) {
                    findSong = i;
                }
            })
            let all = document.querySelectorAll('.results-link');
            all.forEach(f => {
                f.classList.remove('active');
                f.children[0].textContent = 'play_arrow';
                f.children[0].style.opacity = 0;
            });
            let icon = all[findSong].children[0]
            all[findSong].classList.add('active');
            icon.textContent = 'volume_up';
            icon.style.opacity = 1;
        }
    } catch(err){
        console.log(err)
    }
}

let mainSongList = Vue.extend({
    template:
    `<div class="tab-container">
        <div class="search-query" :style="show">
            <div class="search-input">
                <i class="material-icons-outlined">search</i>
                <input v-model="searchQuery" @input="$emit('input', $event.target.value)" v-on:input="query" type="text" placeholder="Search...">
            </div>
        </div>
        <div class="list-container">
            <div class="list-section">
                <i class="material-icons-outlined play-pause" style="visibility: hidden;">play_arrow</i>
                <div class="artist-title-album section">
                    <p class="list-title">Title</p>
                    <p class="list-artist">Artist</p>
                    <p class="list-album">Album</p>
                    <p class="list-duration">Duration</p>
                </div>
            </div>
            <song-list v-for="item in songs" v-bind:song="item" v-bind:key="item.id"></song-list>
        </div>
    </div>`,
    computed: {
        show() {
            if (currentView != "All Songs") {
                return 'display: none'
            } else {
                return 'display: block'
            }
        }
    },
    data() {
        return {
            searchQuery: ""
        }
    },
    methods: {
        query() {
            fetch(`http://${hostnamePort}/api/songs/search?query=${encodeURI(this.searchQuery)}`).then(resp => {
                resp.json().then(async songs => {
                    mainSongListComp.songs = [];
                    songs.forEach(f => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    })
                    let doSort = new Promise(resolve => {
                        updateListOrder('artist', true);
                        resolve();
                    })
                    await doSort;
                    updateActive();
                })
            })
        },
        play(song, isTouch, newQueue, curView, evt) {
            if (isTouch) {
                if (!touch) {
                    this.highlight(evt, song)
                    return;
                }
            }
            if (!audio) {
                audio = new Audio();
            }
            if (!curView) {
                currentPlayingView = currentView;
            }
            currentSong = song;
            audio.removeEventListener('timeupdate', timeUpdate);
            audio.removeEventListener('pause', pauseEvent);
            audio.removeEventListener('play', playEvent);
            audio.removeEventListener('ended', endedEvent);
            audio.src = `http://${hostnamePort}/audio/${encodeURIComponent(song.fileName)}`;
            document.querySelector('.fill').style.width = '0%';
            mediaControls.playPauseIcon = 'pause'
            titleArtist.title = song.title;
            titleArtist.artist = song.artist;
            mobileNp.title = song.title;
            mobileNp.artist = song.artist;
            let imgURL = `http://${hostnamePort}/img/${encodeURIComponent(song.artist)}${encodeURIComponent(song.album)}.jpg`;
            fetch(imgURL).then(response => {
                if (response.ok) {
                    updateImg.updateBg(imgURL)
                } else {
                    updateImg.updateBg();
                }
            });
            currentIndex = queue.indexOf(song);
            updateActive();
            audio.play().then(() => {
                if (newQueue) {
                    queue = [];
                    mainSongListComp.songs.forEach(f => {
                        queue.push(f);
                    })
                    if (mediaControls.shuffleEnabled) {
                        shuffle(queue);
                    }
                    currentIndex = queue.indexOf(song);
                    updateActive();
                }
                updateMediaSession(song);
                audio.addEventListener('pause', pauseEvent);
                audio.addEventListener('play', playEvent);
                audio.addEventListener('ended', endedEvent);
                audio.addEventListener('volumechange', volumechange);
                currentlyPlaying = true;
                audio.addEventListener('timeupdate', onceTimeUpdate);
                audio.addEventListener('timeupdate', timeUpdate);
            })
        },
        highlight(e, song) {
            let newClick = mainSongListComp.songs.indexOf(song);
            let allElements = document.querySelectorAll('.results-link');
            let spKey = e.ctrlKey;
            if (navigator.platform == 'MacIntel') {
                spKey = e.metaKey;
            }
            if (e.type != 'contextmenu' && !spKey) {
                document.querySelectorAll('.results-link').forEach(f => {
                    f.classList.remove('highlight')
                })
            } else if (e.type == 'contextmenu' && highlightedSongs.indexOf(newClick) != -1) {
                return;
            } else if (!spKey) {
                document.querySelectorAll('.results-link').forEach(f => {
                    f.classList.remove('highlight')
                })
            }
            if (!spKey) {
                highlightedSongs = [];
            }
            if (!e.shiftKey) {
                let index = highlightedSongs.indexOf(newClick);
                if (index != -1) {
                    highlightedSongs.splice(index, 1);
                    e.target.classList.remove('highlight');
                } else {
                    highlightedSongs.push(newClick);
                    e.target.classList.add('highlight');
                }
                hlLastClick = mainSongListComp.songs.indexOf(song);
            } else {
                mainSongListComp.songs.forEach((item, index) => {
                    if (hlLastClick < newClick) {
                        if (index <= newClick && index >= hlLastClick) {
                            highlightedSongs.push(index);
                        }
                    } else {
                        if (index >= newClick && index <= hlLastClick) {
                            highlightedSongs.push(index);
                        }
                    }
                })
                highlightedSongs.forEach(f => {
                    allElements[f].classList.add('highlight');
                });
            }
            newHighlight = [];
            highlightedSongs.forEach(f => {
                if (newHighlight.indexOf(f) == -1) {
                    newHighlight.push(f);
                }
            });
            highlightedSongs = newHighlight;
        },
        ctxMenu(e) {
            e.preventDefault();
            if (currentView == 'All Songs' || currentView.startsWith('album') || currentView.startsWith('artist')) {
                openCtx(e, 'song', this);
            }
            if (currentView.startsWith('pl-')) {
                openCtx(e, 'playlistSong', this);
            }
        }
    }
});

let pauseEvent = () => {
    mediaControls.playPauseIcon = 'play_arrow';
}

let playEvent = () => {
    mediaControls.playPauseIcon = 'pause';
}

let endedEvent = () => {
    if (mediaControls.repeatEnabled) {
        audio.currentTime = 0;
        audio.play();
    } else {
        mediaControls.skip();
    }
}

let updateMediaSession = (song) => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album,
            artwork: [{src: `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`, sizes: '512x512', type: 'image/jpeg'}]
        })
        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: audio.currentTime
            });
        }
    }

}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', mediaControls.prev);
    navigator.mediaSession.setActionHandler('nexttrack', mediaControls.skip);
}

let onceTimeUpdate = () => {
    if (audio.duration != NaN) {
        songTime.duration = timeFormat(audio.duration);
        audio.removeEventListener('timeupdate', onceTimeUpdate);
    }
}

let timeUpdate = () => {
    document.querySelector('.fill').style.width = (audio.currentTime / audio.duration) * 100 + '%';
    songTime.current = timeFormat(audio.currentTime);
}

let volumechange = () => {
    if (!volMouseDown && !audio.muted) {
        volFillBar.style.width = audio.volume * 100 + '%';
    }
    if (audio.muted) {
        volControl.muteIcon = 'volume_off'
        volFillBar.style.width = '0%';
    } else {
        volControl.muteIcon = 'volume_up'
    }
}

let sortArray = (array, sortBy) => {
    function compare(a, b) {
        if (a[sortBy].toLowerCase() < b[sortBy].toLowerCase()) return -1;
        if (a[sortBy].toLowerCase() > b[sortBy].toLowerCase()) return 1;
    }
    return array.sort(compare);
}

let simpleSort = (array) => {
    function compare(a, b) {
        if (a.toLowerCase() < b.toLowerCase()) return -1;
        if (a.toLowerCase() > b.toLowerCase()) return 1;
    }
    return array.sort(compare);
}

let updateListOrder = async (sortBy, isQuery) => {
    let allElements = document.querySelectorAll('.results-link');
    if (highlightedSongs.length != 0) {
        highlightedSongs.forEach(f => {
            allElements[f].classList.remove('highlight');
        });
    }
    highlightedSongs = [];
    hlLastClick = 0;
    let doSort;
    if (sortBy) {
        doSort = new Promise(resolve => {
            let sortByOrder = {};
            mainSongListComp.songs.forEach(f => {
                if (sortByOrder[f[sortBy]] == undefined) {
                    sortByOrder[f[sortBy]] = [];
                }
                sortByOrder[f[sortBy]].push(f);
            });
            let sortKeys = simpleSort(Object.keys(sortByOrder));
            let finalSongArray = [];
            sortKeys.forEach(f => {
                sortByOrder[f] = sortArray(sortByOrder[f], 'title');
                sortByOrder[f].forEach(f => {
                    finalSongArray.push(f);
                })
            })
            mainSongListComp.songs = finalSongArray;
            if (currentView == currentPlayingView && !isQuery) {
                queue = [];
                finalSongArray.forEach(f => {
                    queue.push(f);
                })
            }
            resolve();
        })
        await doSort;
    }
}

let mainSongListComp = new mainSongList({
    data: {
        songs: []
    }
});

let allSongs = [];

fetch(`http://${hostnamePort}/api/songs`).then(resp => {
    resp.json().then(songs => {
        if (songs.length == 0) {
            document.querySelector('#addSongsTab').click();
            setTimeout(() => {
                document.querySelector('.cover').style.opacity = 0;
                document.body.style.overflow = "auto";
                setTimeout(() => {
                    document.querySelector('.cover').style.display = 'none'
                }, 250)
            }, 350)
        } else {
            songs.forEach((f, i) => {
                if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                    allSongs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                } else {
                    allSongs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                }
                sortArray(allSongs, 'artist');
                setTimeout(() => {
                    document.querySelector('.cover').style.opacity = 0;
                    document.body.style.overflow = "auto";
                    setTimeout(() => {
                        document.querySelector('.cover').style.display = 'none'
                    }, 250)
                }, 350)
            })
            allSongs.forEach(f => {
                queue.push(f);
                mainSongListComp.songs.push(f);
            });
            updateListOrder('artist');
            tabName.count = mainSongListComp.songs.length;
            tabName.type = 'songs'
            mainSongListComp.$mount('.tab-container');
        }
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
            if (touch) return;
            document.querySelector('.handle').classList.remove('handle-hover')
        }
    }
});

new Vue({
    el: '.seek-container'
})

let volControl = new Vue({
    el: '.controls-right',
    data() {
        return {
            muteIcon: 'volume_up'
        }
    },
    methods: {
        mute() {
            if (audio.muted) {
                this.muteIcon = 'volume_up'
                audio.muted = false;
            } else {
                this.muteIcon = 'volume_off'
                audio.muted = true;
            }
        },
        down(e) {
            mousetouchdown(e, true);
        },
        hover() {
            document.querySelector('.handle-vol').classList.add('handle-hover');
        },
        leave() {
            if (seekMouseDown) return;
            if (touch) return;
            document.querySelector('.handle-vol').classList.remove('handle-hover')
        }
    }
});

let seekBar;
let seekBarWrapper;
let seekFillBar;
let volBar;
let volBarWrapper;
let volFillBar;

setTimeout(() => {
    seekBar = document.querySelector('.seek-bar');
    seekBarWrapper = document.querySelector('#seekWrapper');
    seekFillBar = document.querySelector('.fill');
    volBar = document.querySelector('.vol-bar');
    volBarWrapper = document.querySelector('#volWrapper');
    volFillBar = document.querySelector('.fill-vol');
}, 50)
let seekMouseDown = false;
let volMouseDown = false;
let clamp = (min, val, max) => {
    return Math.min(Math.max(min, val), max);
}

let getP = (e, el) => {
    pBar = (e.clientX - el.getBoundingClientRect().x) / el.clientWidth;
    pBar = clamp(0, pBar, 1);
    return pBar;
}

let mousetouchdown = (e, isVol) => {
    if (currentlyPlaying) {
        if (e.touches) {
            e = e.touches[0]
        }
        if (isVol) {
            pBar = getP(e, volBar);
            if (audio.muted) {
                audio.muted = false;
            }
            volMouseDown = true;
            volFillBar.style.width = pBar * 100 + '%';
            audio.volume = pBar;
            document.querySelector('.handle-vol').classList.add('handle-hover');
        } else {
            pBar = getP(e, seekBar);
            seekMouseDown = true;
            seekFillBar.style.width = pBar * 100 + '%';
            audio.removeEventListener('timeupdate', timeUpdate);
            document.querySelector('.handle').classList.add('handle-hover');
        }
    }
}

let mousetouchmove = e => {
    if (!seekMouseDown && !volMouseDown) return;
    if (currentlyPlaying && seekMouseDown) {
        seekFillBar.style.transition = 'none';
        if (e.touches) {
            e = e.touches[0]
        }
        pBar = getP(e, seekBar);
        if (audio.muted) {
            audio.muted = false;
        }
        seekFillBar.style.width = pBar * 100 + '%';
        songTime.current = timeFormat(pBar * audio.duration);
    } else if(currentlyPlaying && volMouseDown) {
        volFillBar.style.transition = 'none';
        if (e.touches) {
            e = e.touches[0]
        }
        pBar = getP(e, volBar);
        volFillBar.style.width = pBar * 100 + '%';
        audio.volume = pBar;
    }
}

let mousetouchup = e => {
    if (!seekMouseDown && !volMouseDown) return;
    if (currentlyPlaying && seekMouseDown) {
        seekFillBar.style.removeProperty('transition');
        if (e.changedTouches) {
            e = e.changedTouches[0]
        }
        seekMouseDown = false;
        pBar = getP(e, seekBar);
        if (audio.muted) {
            audio.muted = false;
        }
        seekFillBar.style.width = pBar * 100 + '%';
        audio.currentTime = pBar * audio.duration;
        audio.addEventListener('timeupdate', timeUpdate);
        if (touch) return;
        document.querySelector('.handle').classList.remove('handle-hover')
    } else if (currentlyPlaying && volMouseDown) {
        volFillBar.style.removeProperty('transition');
        if (e.changedTouches) {
            e = e.changedTouches[0]
        }
        volMouseDown = false;
        pBar = getP(e, volBar);
        volFillBar.style.width = pBar * 100 + '%';
        if (touch) return;
        document.querySelector('.handle-vol').classList.remove('handle-hover')
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

//song time

let timeFormat = s => {
    let min = Math.floor(s / 60);
    let sec = Math.floor(s - (min * 60));
    if (sec < 10){ 
        sec = `0${sec}`;
    }
    return `${min}:${sec}`;
}

let songTime = new Vue({
    el: '.song-timer',
    data() {
        return {
            current: '-:--',
            duration: '-:--'
        }
    }
})

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

let doAddSongs = async (evt, drag) => {
    evt.preventDefault();
    let files = evt.target.files;
    if (drag) {
        files = evt.dataTransfer.files;
    }
    console.log(files);
    try {
        document.querySelectorAll('.add-song-item').forEach(f => {
            f.classList.remove('done');
            f.classList.remove('bad');
            f.classList.add('flashing');
        })
    } catch(err) {}
    addSong.uploadSongs = [];
    Array.from(files).forEach((f, i) => {
        addSong.uploadSongs.push({name: f.name, icon: 'cloud_queue', status: 'Waiting...'});
    });
    setTimeout(() => {
        async.eachOfSeries(Array.from(files), async (f, i) => {
            let waitDone = new Promise(resolve => {
                if (files[i].type == 'audio/mpeg' || files[i].type == 'audio/x-m4a') {
                    console.log(`${i} |||| ${f}`)
                    addSong.uploadSongs[i].icon = 'autorenew';
                    document.querySelectorAll('.add-song-item')[i].classList.remove('flashing');
                    document.querySelectorAll('.add-song-item')[i].classList.add('spinning');
                    addSong.uploadSongs[i].status = 'Uploading...';
                    let reader = new FileReader();
                    reader.readAsArrayBuffer(files[i]);
                    reader.onload = (buffer => {
                        fetch(`http://${hostnamePort}/api/songs/add`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'audio/mpeg',
                                'Filename': encodeURIComponent(files[i].name)
                            },
                            body: buffer.target.result
                        }).then(resp => {
                            if (resp.ok) {
                                console.log('ok!');
                                document.querySelectorAll('.add-song-item')[i].classList.remove('spinning');
                                document.querySelectorAll('.add-song-item')[i].classList.add('done');
                                addSong.uploadSongs[i].icon = 'done';
                                addSong.uploadSongs[i].status = 'Done';
                                resolve();
                            }
                        })
                    })
                } else {
                    document.querySelectorAll('.add-song-item')[i].classList.remove('flashing');
                    document.querySelectorAll('.add-song-item')[i].classList.add('bad');
                    if (files[i].type.startsWith('audio/')) {
                        addSong.uploadSongs[i].status = 'Skipped: this audio format is unsupported';
                    } else {
                        addSong.uploadSongs[i].status = 'Skipped: not a valid audio file';
                    }
                    addSong.uploadSongs[i].icon = 'error_outline';
                    resolve();
                }
            });
            await waitDone;
            fetch(`http://${hostnamePort}/api/songs`).then(resp => {
                resp.json().then(songs => {
                    allSongs = [];
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            allSongs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            allSongs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    });
                    sortArray(allSongs, 'artist');
                })
            });
            console.log('waited!');
        })
    }, 1000)
}

//sidebar
let currentActiveTab = 'allButton'

let mountedTab = null;

Vue.component('sidebar-items', {
    props: ['sideitem'],
    template:
    `<div v-bind:class="{ active: activeC }" v-on:click="click($event, sideitem)" v-if="sideitem.type == 'item'" class="side-item side-click">
        <i class="material-icons-outlined">{{ sideitem.icon }}</i>
        <span>{{ sideitem.label }}</span>
    </div>
    <div v-else-if="sideitem.type == 'label'" class="side-label">{{sideitem.label}}</div>`,
    computed: {
        activeC() {
            if (this.sideitem.label == 'All Songs') {
                return true
            }
        }
    },
    mounted() {
        if (this.sideitem.label == 'All Songs') {
            let indicator = document.querySelector('.active-indicator');
            indicator.style.height = this.$el.getBoundingClientRect().height + 'px';
            indicator.style.top = this.$el.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
        }
    },
    methods: {
        click(e, sideItem) {
            sidebar.click(e, sideItem);
        }
    }
})

let sidebar = new Vue({
    el: '.temp-sidebar',
    template: 
    `<div class="sidebar-wrap">
        <div class="active-indicator" style="top: 85px"></div>
        <sidebar-items v-for="item in sidebarItems" v-bind:sideitem="item" v-bind:key="item.id" v-bind:id="item.id"></sidebar-items>
    </div>`,
    data() {
        return {
            sidebarItems: [
                {id: 'addSongsTab', type: 'item', label: 'Add Songs', icon: 'add'},
                {id: 'settingsTab', type: 'item', label: 'Settings', icon: 'settings'},
                {id: 'libraryLabel', type: 'label', label: 'Library'},
                {id: 'allTab', type: 'item', label: 'All Songs', icon: 'music_note'},
                {id: 'artistsTab', type: 'item', label: 'Artists', icon: 'person'},
                {id: 'albumsTab', type: 'item', label: 'Albums', icon: 'album'},
                {id: 'playlistLabel', type: 'label', label: 'Playlists'}
            ]
        }
    },
    methods: {
        async click(evt, item) {
            document.querySelectorAll('.side-click').forEach(f => {
                f.classList.remove('active');
            });
            evt.target.classList.add('active');
            tabName.title = item.label;
            tabName.hideButtons();
            if (mountedTab != null) {
                mountedTab.$destroy;
                document.querySelector('.tab-container').innerHTML = '';
            }
            switch(item.id) {
                case "allTab":
                    mainSongListComp = new mainSongList({
                        data: {
                            songs: []
                        }
                    });
                    allSongs.forEach(f => {
                        mainSongListComp.songs.push(f);
                    });
                    currentView = "All Songs";
                    tabName.showButtons(false, null, null, null, false, true);
                    mainSongListComp.$mount('.tab-container');
                    if (currentIndex) {
                        updateActive();
                    }
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs'
                    mountedTab = mainSongListComp;
                    break;
                case "homeTab":
                    let home = new homeTab;
                    home.$mount('.tab-container');
                    mountedTab = homeTab;
                    currentView = "Home";
                    break;
                case "albumsTab":
                    album = new albumTab({
                        data() {
                            return {
                                albumList: []
                            }
                        }
                    });
                    fetch(`http://${hostnamePort}/api/albums`).then(resp => {
                        resp.json().then(albums => {
                            sortArray(albums, "name");
                            albums.forEach((f, i) => {
                                album.albumList.push({id: i, name: f.name, artist: f.artist});
                            });
                            tabName.count = album.albumList.length;
                            tabName.type = 'albums'
                        })
                    })
                    tabName.showButtons(false, null, null, null, false, true);
                    album.$mount('.tab-container');
                    mountedTab = albumTab;
                    currentView = "Albums"
                    break;
                case "artistsTab":
                    artist = new artistTab({
                        data() {
                            return {
                                artistList: []
                            }
                        }
                    });
                    fetch(`http://${hostnamePort}/api/artists`).then(resp => {
                        resp.json().then(artists => {
                            sortArray(artists, "artist");
                            artists.forEach((f, i) => {
                                artist.artistList.push({id: i, artist: f.artist});
                            });
                            tabName.count = artist.artistList.length;
                            tabName.type = 'artists'
                        })
                    });
                    tabName.showButtons(false, null, null, null, false, true);
                    artist.$mount('.tab-container');
                    mountedTab = artistTab;
                    currentView = "Artists"
                    break;
                case "addSongsTab":
                    addSong = new addSongs({
                        data() {
                            return {
                                uploadSongs: []
                            }
                        }
                    });
                    tabName.showButtons(false, null, null, null, false, false);
                    addSong.$mount('.tab-container');
                    mountedTab = addSongs;
                    currentView = "AddSongs";
                    document.querySelector('.no-tab').ondragover = (evt) => {
                        evt.preventDefault();
                        document.querySelector('.no-tab').classList.add('drag');
                    };
                    document.querySelector('.no-tab').ondragleave = (evt) => {
                        evt.preventDefault();
                        document.querySelector('.no-tab').classList.remove('drag');
                    };
                    document.querySelector('.no-tab').ondrop = evt => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        document.querySelector('.no-tab').classList.remove('drag');
                        doAddSongs(evt, true);
                    };
                    break;
                case "settingsTab":
                    let serverInfo = "";
                    let getInfo = new Promise(resolve => {
                        fetch(`http://${hostnamePort}/api/about`).then(resp => {
                            resp.text().then(text => {
                                serverInfo = text;
                                resolve();
                            })
                        })
                    })
                    await getInfo;
                    settings = new settingsTab({
                        data() {
                            return {
                                settingsItems: [
                                    {
                                        id: 'appearanceLabel',
                                        type: 'label',
                                        label: 'Appearance'
                                    },
                                    {
                                        id: 'themeCombo',
                                        type: 'combo',
                                        label: 'Theme',
                                        options: [
                                            'system',
                                            'light',
                                            'dark'
                                        ],
                                        action: 'switchTheme'
                                    },
                                    {
                                        id: 'schemeCombo',
                                        type: 'combo',
                                        label: 'Colour Scheme',
                                        options: [
                                            'firetail',
                                            'purple',
                                            'green'
                                        ],
                                        action: 'switchScheme'
                                    },
                                    {
                                        id: 'aboutLabel',
                                        type: 'label',
                                        label: 'About'
                                    },
                                    {
                                        id: 'aboutFiretail',
                                        type: 'custom',
                                        html:
                                        `<div class="about-firetail">
                                            <div class="firetail-logo"></div>
                                            <div class="about-text">
                                                <h3>Firetail Web</h3>
                                                <p>v1.0.0</p>
                                                <p>Copyright &copy; 2020 projsh_</p>
                                            </div>
                                        </div>`
                                    },
                                    {
                                        id: 'serverLabel',
                                        type: 'label',
                                        label: 'Server Information'
                                    },
                                    {
                                        id: 'serverInfo',
                                        type: 'custom',
                                        html: `<p>${serverInfo}</p>`
                                    }
                                ]
                            }
                        }
                    });
                    settings.$mount('.tab-container');
                    mountedTab = settingsTab;
                    currentView = "Settings";
                    break;
                default:
                    let missingTab = new noTab;
                    tabName.showButtons(false, null, null, null, false, false);
                    missingTab.$mount('.tab-container');
                    mountedTab = noTab;
                    currentView = "Unknown"
            }
            let indicator = document.querySelector('.active-indicator');
            indicator.style.height = evt.target.getBoundingClientRect().height + 'px';
            indicator.style.top = evt.target.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
        }
    }
});

Vue.component('playlist-items', {
    props: ['plitem'],
    template: 
    `<div v-on:contextmenu="ctxMenu($event)" class="side-list-item side-click" v-on:click="click($event)">
        <div>{{plitem.label}}</div>
    </div>`,
    methods: {
        click(evt) {
            document.querySelectorAll('.side-click').forEach(f => {
                f.classList.remove('active');
            });
            evt.target.classList.add('active');
            tabName.title = this.plitem.label;
            tabName.hideButtons();
            if (mountedTab != null) {
                mountedTab.$destroy;
                document.querySelector('.tab-container').innerHTML = '';
            }
            mainSongListComp = new mainSongList({
                data: {
                    songs: []
                }
            });
            fetch(`http://${hostnamePort}/api/playlists/get?id=${this.plitem.id}`).then(resp => {
                resp.json().then(pl => {
                    pl.songs.forEach(f => {
                        allSongs.forEach(a => {
                            if (mainSongListComp.songs.indexOf(a) != -1) return;
                            if (a.id == f) {
                                mainSongListComp.songs.push(a);
                            }
                        })
                    });
                    currentView = `pl-${this.plitem.id}`;
                    mainSongListComp.$mount('.tab-container');
                    tabName.showButtons(true, null, null, pl.imgData, false, true);
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs'
                    updateActive();
                    mountedTab = mainSongListComp;
                    let indicator = document.querySelector('.active-indicator');
                    indicator.style.height = evt.target.getBoundingClientRect().height + 'px';
                    indicator.style.top = evt.target.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
                })
            });
        },
        ctxMenu(e) {
            openCtx(e, 'playlist', this);
        }
    }
});

let playlistItems = new Vue({
    el: '.playlist-items-container',
    data() {
        return {
            listItems: []
        }
    }
})

fetch(`http://${hostnamePort}/api/playlists/names`).then(resp => {
    resp.json().then(playlists => {
        playlists.forEach(f => {
            playlistItems.listItems.push({label: f.name, id: f.id});
        })
    })
})

let tabName = new Vue({
    el: '.top-title',
    data() {
        return {
            title: 'All Songs',
            count: 0,
            type: 'songs'
        }
    },
    methods: {
        async showButtons(showAlbumArt, album, artist, dataurl, showBack, showCount) {
            if (showBack) {
                document.querySelector('#tabBackButton').style.display = 'block';
            }
            if (showCount) {
                document.querySelector('.top-title p').style.display = 'block';
            } else {
                document.querySelector('.top-title p').style.display = 'none';
            }
            if (showAlbumArt && !dataurl) {
                let img =  `http://${hostnamePort}/img/${artist}${album}.jpg`;
                let finImg = `/assets/no_album.svg`;
                let getImg = fetch(img).then(resp => {
                    if (resp.ok) {
                        finImg = img;
                    }
                });
                await getImg;
                document.querySelector('.tab-album-art').style.backgroundImage = `url('${finImg}')`;
                document.querySelector('.tab-album-art').style.display = 'block';
            } else if (showAlbumArt) {
                document.querySelector('.tab-album-art').style.backgroundImage = `url('${dataurl}')`;
                document.querySelector('.tab-album-art').style.display = 'block';
            } else if (!showAlbumArt) {
                document.querySelector('.tab-album-art').style.display = 'none';
            }
        },
        hideButtons(showCount) {
            document.querySelector('#tabBackButton').style.display = 'none';
            document.querySelector('.tab-album-art').style.display = 'none';
            if (showCount) {
                document.querySelector('.top-title p').style.display = 'block';
            } else {
                document.querySelector('.top-title p').style.display = 'none';
            }
        },
        backBtn() {
            if (currentView.startsWith('album')) {
                document.querySelector('#albumsTab').click();
            } else if (currentView.startsWith('artist')) {
                document.querySelector('#artistsTab').click();
            }
        }
    }
})

//missing tab
let noTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="no-tab">
            <i class="material-icons-outlined missing-icon">block</i>
            <div>
                <h1>Tab missing</h1>
                <p>The handler for this tab seems to be missing.</p>
            </div>
        </div>
    </div>`
});

//home tab
let homeTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="home">
            <i class="material-icons-outlined missing-icon">home</i>
            <div>
                <h1>We're busy building your home tab!</h1>
                <p>Check back later, you'll see this tab change over time!</p>
            </div>
        </div>
    </div>`
});

let home = new homeTab

//home.$mount('.tab-container');

//albums tab

Vue.component('album-items', {
    props: ['album'],
    template:
    `<div class="album-item" v-on:click="getAlbum(album.name, album.artist)">
        <img loading="lazy" class="album-item-art" @load="load" v-bind:src="bg"/>
        <div class="album-info">
            <p class="album-name">{{album.name}}</p>
            <p class="album-artist">{{album.artist}}</p>
        </div>
    </div>`,
    asyncComputed: {
        bg: async function() {
            let img =  `http://${hostnamePort}/img/${this.album.artist}${this.album.name}.jpg`;
            let finImg = `/assets/no_album.svg`;
            let getImg = fetch(img).then(resp => {
                if (resp.ok) {
                    finImg = img;
                }
            });
            await getImg;
            return finImg;
        }
    },
    methods: {
        load() {
            this.$el.children[0].style.opacity = 1;
        },
        getAlbum(album, artist) {
            fetch(`http://${hostnamePort}/api/albums/get?album=${encodeURIComponent(album)}`).then(resp => {
                resp.json().then(songs => {
                    mountedTab.$destroy;
                    document.querySelector('.tab-container').innerHTML = '';
                    mainSongListComp = new mainSongList({
                        data: {
                            songs: []
                        }
                    });
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    });
                    updateListOrder('title')
                    tabName.showButtons(true, album, artist, null, true, true);
                    tabName.title = album;
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs';
                    currentView = `album-${album}`;
                    mainSongListComp.$mount('.tab-container');
                    if (currentIndex) {
                        updateActive();
                    }
                    mountedTab = mainSongListComp;
                })
            })
        }
    }
})

let albumTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="album-tab">
            <album-items v-for="item in albumList" v-bind:album="item" v-bind:key="item.id"></album-items>
        </div>
    </div>`
})

let mobileNp = new Vue({
    el: '.np-mobile-container',
    methods: {
        expand() {
            document.body.style.overflow = 'hidden';
            document.querySelector('.np-top').classList.add('expand');
            document.querySelector('.np-container').style.opacity = 1;
            document.querySelector('.np-container').style.display = 'flex'
            this.$el.style.display = 'none';
            document.querySelector('.np-mobile-container').style.opacity = 0;
        },
        playPause() {
            
        }
    },
    data() {
        return {
            title: 'No song playing',
            artist: ''
        }
    }
});

let mobileNpExpand = new Vue({
    el: '.mobile-top-btns',
    methods: {
        hide() {
            document.body.style.overflow = 'auto';
            document.querySelector('.np-top').classList.remove('expand');
            document.querySelector('.np-container').style.opacity = 0;
            setTimeout(() => {
                document.querySelector('.np-container').style.display = 'none';
                document.querySelector('.np-mobile-container').style.display = 'flex';
                setTimeout(() => {
                    document.querySelector('.np-mobile-container').style.opacity = 1;
                }, 20)
            }, 500)
        }
    }
})

//popup
let playlistImageEl = "";

let popup = {
    open(wpopup) {
        switch(wpopup) {
            case "createPlaylist":
                ftpopup.title = 'Create Playlist';
                playlistCreateMenu = new createPlaylist({
                    methods: {
                        create() {
                            let plToSend = {
                                name: this.puName,
                                desc: this.puDesc,
                                imgData: playlistImageEl,
                                songs: []
                            }
                            fetch(`http://${hostnamePort}/api/playlists/create`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(plToSend)
                            }).then(resp => {
                                resp.json().then(playlists => {
                                    playlistItems.listItems = [];
                                    playlists.forEach(f => {
                                        playlistItems.listItems.push({label: f.name, id: f.id});
                                    })
                                    popup.close();
                                })
                            })
                        }
                    },
                    data: {
                        puName: 'My Playlist',
                        puDesc: ''
                    }
                });
                popup.mounted = playlistCreateMenu;
                playlistCreateMenu.$mount('.popup-content');
                playlistImageEl = '';
                break;
            case "addPL":
                ftpopup.title = 'Add to Playlist';
                addPLex = new addPL({
                    data: {
                        plList: []
                    },
                    created() {
                        this.plList = playlistItems.listItems;
                    }
                })
                popup.mounted = addPLex;
                addPLex.$mount('.popup-content');
                break;
            case "editPL":
                ftpopup.title = 'Edit Playlist'
                let editPL = new editPlaylist({
                    data: {
                        puName: 'Playlist Title',
                        puDesc: 'Playlist Desc'
                    },
                    created() {
                        fetch(`http://${hostnamePort}/api/playlists/get?id=${encodeURIComponent(itemClicked.plitem.id)}`).then(resp => {
                            resp.json().then(json => {
                                let pl = json;
                                this.puName = pl.name;
                                this.puDesc = pl.desc;
                                if (pl.imgData != "") {
                                    document.querySelector('.playlist-create-img').style.backgroundImage = `url('${pl.imgData}')`
                                }
                            })
                        })
                    },
                    methods: {
                        edit() {
                            fetch(`http://${hostnamePort}/api/playlists/get?id=${encodeURIComponent(itemClicked.plitem.id)}`).then(resp => {
                                resp.json().then(json => {
                                    let pl = json;
                                    pl.name = this.puName;
                                    pl.desc = this.puDesc;
                                    pl.imgData = playlistImageEl;
                                    pl = JSON.stringify(pl);
                                    fetch(`http://${hostnamePort}/api/playlists/update`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: pl
                                    }).then(nextResp => {
                                        nextResp.json().then(nextJson => {
                                            playlistItems.listItems = [];
                                            nextJson.forEach(f => {
                                                playlistItems.listItems.push({label: f.name, id: f.id});
                                            })
                                            popup.close();
                                        })
                                    })
                                })
                            })
                        }
                    }
                })
                popup.mounted = editPL;
                editPL.$mount('.popup-content');
        }
        document.querySelector('.popup').classList.remove('hidden');
        document.querySelector('.popup').classList.add('open');
        document.querySelector('.popup-win').classList.remove('hidden');
    },
    close() {
        //keyboardControl();
        document.querySelector('.popup').classList.remove('open');
        document.querySelector('.popup').classList.add('hidden');
        document.querySelector('.popup-win').classList.add('hidden');
        setTimeout(() => {
            popup.mounted.$destroy;
            document.querySelector('.popup-content').innerHTML = '';
        }, 200);
    },
    mounted: null
}

document.querySelector('#addPlaylistImage').addEventListener('change', (evt) => {
    let reader = new FileReader();
    reader.readAsDataURL(evt.target.files[0]);
    console.log(evt.target.files)
    reader.onload = (e) => {
        playlistImageEl = e.target.result;
        document.querySelector('.playlist-create-img').style.backgroundImage = `url('${e.target.result}')`
    }
})

let ftpopup = new Vue({
    el: '.popup',
    data: {
        title: 'popup Title'
    },
    methods: {
        closePopup() {
            popup.close();
        }
    }
})

new Vue({
    el: '.add-playlist',
    methods: {
        open() {
            popup.open('createPlaylist')
        }
    }
})

let createPlaylist = Vue.extend({
    template: 
    `<div class="popup-content">
        <div class="playlist-create-flex">
            <div>
                <label for="addPlaylistImage" class="playlist-image-label">Add image</label>
                <div class="playlist-create-img"></div>
            </div>
            <div>
                <div class="input-label">Title</div>
                <input type="text" v-model="puName" @input="$emit('input', $event.target.value)" placeholder="My Playlist">
                <div class="input-label">Description</div>
                <textarea class="long-text" v-model="puDesc" @input="$emit('textarea', $event.target.value)" placeholder="Write a lovely description about your playlist here..."></textarea>
            </div>
        </div>
        <div class="button-right">
            <div v-on:click="create" class="button"><span>Create</span></div>
        </div>
    </div>`
});

let editPlaylist = Vue.extend({
    template: 
    `<div class="popup-content">
        <div class="playlist-create-flex">
            <div>
                <label for="addPlaylistImage" class="playlist-image-label">Add image</label>
                <div class="playlist-create-img"></div>
            </div>
            <div>
                <div class="input-label">Title</div>
                <input type="text" v-model="puName" @input="$emit('input', $event.target.value)" placeholder="My Playlist">
                <div class="input-label">Description</div>
                <textarea class="long-text" v-model="puDesc" @input="$emit('textarea', $event.target.value)" placeholder="Write a lovely description about your playlist here..."></textarea>
            </div>
        </div>
        <div class="button-right">
            <div v-on:click="edit" class="button"><span>Edit</span></div>
        </div>
    </div>`
});

/* Context menu */
Vue.component('ctx-item', {
    props: ['list'],
    template: '<div class="context-item" v-on:click="click"><i class="material-icons-outlined">{{list.icon}}</i><span>{{ list.name }}</span></div>',
    methods: {
        click() {
            switch(this.list.id) {
                case "addPlaylist":
                    popup.open('addPL');
                    break;
                case "removePlaylist":
                    fetch(`http://${hostnamePort}/api/playlists/delete?id=${encodeURIComponent(itemClicked.plitem.id)}`).then(resp => {
                        resp.json().then(playlists => {
                            playlistItems.listItems = [];
                            playlists.forEach(f => {
                                playlistItems.listItems.push({label: f.name, id: f.id});
                            })
                            document.querySelector('#allTab').click();
                        })
                    })
                    break;
                case "editPlaylist":
                    popup.open('editPL');
                    break;
                case "removeFromLibrary":
                    let songIDs = [];
                    mainSongListComp.songs.forEach((f, i) => {
                        if (highlightedSongs.indexOf(i) != -1) {
                            songIDs.push(f.id);
                        }
                    });
                    fetch(`http://${hostnamePort}/api/songs/delete`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(songIDs)
                    }).then(resp => {
                        resp.json().then(songs => {
                            allSongs = [];
                            songs.forEach((f, i) => {
                                if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                                    allSongs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                                } else {
                                    allSongs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                                }
                            });
                            sortArray(allSongs, 'artist');
                            document.querySelector('#allTab').click();
                        })
                    })
                    break;
                case "rmSongPlaylist":
                    fetch(`http://${hostnamePort}/api/playlists/get?id=${encodeURIComponent(currentView.substr(3))}`).then(resp => {
                        resp.json().then(pl => {
                            let songs = pl.songs;
                            highlightedSongs.forEach(f => {
                                let songID;
                                try {
                                    songID = mainSongListComp.songs[f].id;
                                } catch(err) {
                                    songID = null;
                                }
                                let index = songs.indexOf(songID);
                                if (index != -1) {
                                    songs.splice(index, 1);
                                }
                            });
                            pl.songs = songs;
                            fetch(`http://${hostnamePort}/api/playlists/update`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(pl)
                            }).then(nextResp => {
                                nextResp.json().then(() => {
                                    fetch(`http://${hostnamePort}/api/playlists/get?id=${encodeURIComponent(currentView.substr(3))}`).then(resp => {
                                        resp.json().then(pl => {
                                            mainSongListComp.songs = [];
                                            pl.songs.forEach(f => {
                                                allSongs.forEach(a => {
                                                    if (mainSongListComp.songs.indexOf(a) != -1) return;
                                                    if (a.id == f) {
                                                        mainSongListComp.songs.push(a);
                                                    }
                                                })
                                            });
                                            tabName.count = pl.songs.length;
                                        })
                                    })
                                })
                            })
                        })
                    })
            }
        }
    }
});

let highlightedSongs = [];
let hlLastClick = 0;

ctxListSong = [
    {name: 'Add to playlist', id: 'addPlaylist', icon: 'playlist_add'},
    {name: 'Remove from library', id: 'removeFromLibrary', icon: 'delete'}
]

ctxListPlaylist = [
    {name: 'Edit Playlist', id: 'editPlaylist', icon: 'edit'},
    {name: 'Remove Playlist', id: 'removePlaylist', icon: 'delete'}
]

ctxPlaylistItems = [
    {name: 'Remove from playlist', id: 'rmSongPlaylist', icon: 'delete'},
    {name: 'Remove from library', id: 'removeFromLibrary', icon: 'delete'}
]

let ctxItems = new Vue({
    el: '.context-list',
    data: {
        ctxList: ctxListSong
    }
})

document.addEventListener('click', (e) => {
    if (e.target.classList[0] == 'top-title') {
        let allElements = document.querySelectorAll('.results-link');
        if (highlightedSongs.length != 0) {
            highlightedSongs.forEach(f => {
                allElements[f].classList.remove('highlight');
            });
        }
        highlightedSongs = [];
        hlLastClick = 0;
    }
    document.querySelector('.context-menu').style.display = 'none'
})

let openCtx = (e, type, item) => {
    e.preventDefault();
    ctxMenu = document.querySelector('.context-menu');
    ctxMenu.style.display = 'block'
    if (e.pageX + ctxMenu.offsetWidth >= window.innerWidth) {
        xPosition = e.pageX - ctxMenu.offsetWidth;
    } else {
        xPosition = e.pageX;
    }
    if (e.pageY + ctxMenu.offsetHeight >= window.innerHeight) {
        yPosition = e.pageY - ctxMenu.offsetHeight - window.scrollY;
    } else {
        yPosition = e.pageY - window.scrollY;
    }
    switch(type) {
        case "song":
            ctxItems.ctxList = ctxListSong;
            break;
        case "playlist":
            ctxItems.ctxList = ctxListPlaylist;
            break;
        case "playlistSong":
            ctxItems.ctxList = ctxPlaylistItems;
    }
    itemClicked = item;
    ctxMenu.style.left = xPosition + 'px';
    ctxMenu.style.top = yPosition + 'px';
}

//addpl
let addPL = Vue.extend({
    template:
    `<div class="popup-content">
        <pl-list v-for="item in plList" v-bind:playlist="item" v-bind:key="item.id"></pl-list>
    </div>`
})

Vue.component('pl-list', {
    props: ['playlist'],
    computed: {
        bg() {
            //if (this.playlist.image == '/assets/no_album.svg') {
                return `background-image: url('/assets/no_album.svg')`;
            //} else {
                //return `background-image: url('http://${}/${this.playlist.id}.png')`;
            //}
        }
    },
    template:
    `<div v-on:click="add" class="addPl-item">
        <div class="addPl-img" v-bind:style="bg">
        </div>
        <span>{{playlist.label}}</span>
    </div>`,
    methods: {
        add() {
            fetch(`http://${hostnamePort}/api/playlists/get?id=${encodeURIComponent(this.playlist.id)}`).then(resp => {
                resp.json().then(json => {
                    let pl = json;
                    highlightedSongs.forEach(f => {
                        pl.songs.push(mainSongListComp.songs[f].id);
                    });
                    pl = JSON.stringify(pl);
                    fetch(`http://${hostnamePort}/api/playlists/update`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: pl
                    }).then(nextResp => {
                        nextResp.json().then(nextJson => {
                            popup.close();
                        })
                    })
                })
            })
        }
    }
});

//artists
let artistTab = Vue.extend({
    template:
    `<div class="tab-container">
        <div class="artist-tab">
            <artist-items v-for="item in artistList" v-bind:artist="item" v-bind:key="item.id"></artist-items>
        </div>
    </div>`
})

Vue.component('artist-items', {
    props: ['artist'],
    template:
    `<div class="artist-item" v-on:click="getArtist($event)">
        <p>{{artist.artist}}</p>
    </div>`,
    methods: {
        getArtist(evt) {
            let artist = this.artist.artist;
            mountedTab.$destroy;
            document.querySelector('.tab-container').innerHTML = '';
            mainSongListComp = new mainSongList({
                data: {
                    songs: []
                }
            });
            fetch(`http://${hostnamePort}/api/artists/get?artist=${encodeURIComponent(artist)}`).then(resp => {
                resp.json().then(async songs => {
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, duration: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, duration: f.duration});
                        }
                    });
                    updateListOrder('album')
                    tabName.count = mainSongListComp.songs.length;
                    tabName.type = 'songs';
                    currentView = `artist-${artist}`;
                    mainSongListComp.$mount('.tab-container')
                    tabName.title = artist;
                    tabName.showButtons(false, null, null, null, true, true);
                    updateActive();
                    mountedTab = mainSongListComp;
                })
            })
        }
    }
});

//add songs
document.querySelector('#addSongs').addEventListener('change', doAddSongs);

Vue.component('adding-songs', {
    props: ['file'],
    template:
    `<div class="add-song-item flashing">
        <i class="material-icons-outlined">{{file.icon}}</i>
        <div class="upload-text">
            <p>{{file.name}}</p>
            <div class="upload-status">{{file.status}}</div>
        </div>
    </div>`
})

let addSongs = Vue.extend({
    template:
    `<div class="tab-container">
        <div class="add-songs-tab">
            <div class="no-tab">
                <div class="upload-glyph"></div>
                <div class="text">
                    <h1>Drag your songs here!</h1>
                    <p>Songs uploaded here will be added to your library once completed.</p>
                </div>
            </div>
                <label for="addSongs" class="button">
                    <i class="material-icons-outlined">cloud_upload</i>
                    <span>Choose Files</span>
                </label>
                <adding-songs v-for="item in uploadSongs" v-bind:file="item" v-bind:key="item.id"></adding-songs>
            </div>
        </div>
    </div>`
});

//settings tab
Vue.component('settings-tab', {
    props: ['settingsItem'],
    template:
    `<div class="settings-items-container">
        <h2 v-if="settingsItem.type == 'label'">{{settingsItem.label}}</h2>
        <div v-else-if="settingsItem.type == 'combo'" class="settings-item combo">
            <p>{{settingsItem.label}}</p>
            <select v-on:change="click(settingsItem.action, $event.target.value)">
                <option v-for="item in settingsItem.options" v-bind:selected="getSetting(settingsItem.id, item)">{{item}}</option>
            </select>
        </div>
        <div v-else-if="settingsItem.type == 'toggle'" class="settings-item toggle">
            <p>{{settingsItem.label}}</p>
            <label class="switch">
                <input v-on:change="click(settingsItem.action, $event.target.checked)" v-bind:selected="getSetting(settingsItem.id)" type="checkbox">
                <span class="switch-slider round"></span>
            </label>
        </div>
        <div v-else-if="settingsItem.type == 'custom'" class="custom-html" v-html="settingsItem.html"></div>
    </div>`,
    methods: {
        getSetting(id, data) {
            switch(id) {
                case "themeCombo":
                    if (data == localStorage.getItem('theme')) return true;
                    break;
                case "schemeCombo":
                    if (data == localStorage.getItem('scheme')) return true;
                    break;
            }
        },
        click(action, data) {
            switch(action) {
                case "switchTheme":
                    localStorage.setItem('theme', data);
                    if (localStorage.getItem('theme') == 'dark') {
                        updateMode('dark');
                    } else if (localStorage.getItem('theme') == 'light') {
                        updateMode('light');
                    } else {
                        try {
                            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && localStorage.getItem('theme') == 'system') {
                                updateMode('dark');
                            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches && localStorage.getItem('theme') == 'system') {
                                updateMode('light');
                            }
                        } catch(err) {
                            updateMode('dark');
                        }
                    }
                    break;
                case "switchScheme":
                    htmlClass.remove(localStorage.getItem('scheme'));
                    localStorage.setItem('scheme', data);
                    switch(localStorage.getItem('scheme')) {
                        case "firetail":
                            htmlClass.add('firetail');
                            break;
                        case "purple":
                            htmlClass.add('purple');
                            break;
                        case "green":
                            htmlClass.add('green');
                            break;
                        default:
                            htmlClass.add('firetail');
                    }
            }
        }
    }
})

let settingsTab = Vue.extend({
    template:
    `<div class="tab-container">
        <div class="settings-tab">
            <div class="settings-tab-spacer">
                <settings-tab v-for="item in settingsItems" v-bind:settingsItem="item" v-bind:key="item.id"></settings-tab>
            </div>
        </div>
    </div>`
});