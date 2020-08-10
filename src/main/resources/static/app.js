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
            mainSongListComp.play(queue[currentIndex + 1], false, false, true);
        },
        prev() {
            if (audio.currentTime < 3) {
                mainSongListComp.play(queue[currentIndex - 1], false, false, false);
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
            <p class="list-artist"><span>{{song.artist}}</span></p>
            <p class="list-album"><span>{{song.album}}</span></p>
            <p class="list-duration"><span>{{song.dur}}</span></p>
        </div>
    </li>`,
    methods: {
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
            let findSong = mainSongListComp.songs.indexOf(currentSong);
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
    methods: {
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
            audio.src = `http://${hostnamePort}/audio/${song.fileName}`;
            document.querySelector('.fill').style.width = '0%';
            //audio.load();
            mediaControls.playPauseIcon = 'pause'
            titleArtist.title = song.title;
            titleArtist.artist = song.artist;
            mobileNp.title = song.title;
            mobileNp.artist = song.artist;
            let imgURL = `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`;
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
                    currentIndex = queue.indexOf(song);
                    updateActive();
                }
                updateMediaSession(song);
                audio.addEventListener('pause', pauseEvent);
                audio.addEventListener('play', playEvent);
                audio.addEventListener('ended', endedEvent)
                currentlyPlaying = true;
                audio.addEventListener('timeupdate', onceTimeUpdate);
                audio.addEventListener('timeupdate', timeUpdate);
            })
        },
        highlight(e, song) {
            let newClick = mainSongListComp.songs.indexOf(song);
            let allElements = document.querySelectorAll('.results-link');
            if (e.type != 'contextmenu' && !e.ctrlKey) {
                document.querySelectorAll('.results-link').forEach(f => {
                    f.classList.remove('highlight')
                })
            } else if (e.type == 'contextmenu' && highlightedSongs.indexOf(newClick) != -1) {
                return;
            } else if (!e.ctrlKey) {
                document.querySelectorAll('.results-link').forEach(f => {
                    f.classList.remove('highlight')
                })
            }
            if (!e.ctrlKey) {
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
            if (currentView == 'All Songs') {
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

let allSongs = [];

fetch(`http://${hostnamePort}/api/songs`).then(resp => {
    resp.json().then(songs => {
        songs.forEach((f, i) => {
            if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                allSongs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
            } else {
                allSongs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
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

        mainSongListComp.$mount('.tab-container');
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
        songTime.current = timeFormat(pBar * audio.duration);
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
        if (touch) return;
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
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        updateMode('light');
    } else {
        updateMode('dark');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        updateMode(e.matches ? 'dark' : 'light');
    })
} catch(err) {}

//sidebar

let currentActiveTab = 'allButton'

let mountedTab = null;

let sidebar = new Vue({
    el: '.temp-sidebar',
    template: 
    `<div class="sidebar-wrap">
        <div class="active-indicator" style="top: 85px"></div>
        <div v-for="item in sidebarItems" v-bind:sideitem="item" v-bind:id="item.id">
            <div v-on:load="active($event)" :style="active" v-on:click="click($event, item)" v-if="item.type == 'item'" class="side-item side-click">
                <i class="material-icons-outlined">{{ item.icon }}</i>
                <span>{{ item.label }}</span>
            </div>
            <div v-else-if="item.type == 'label'" class="side-label">{{item.label}}</div>
        </div>
    </div>`,
    data() {
        return {
            sidebarItems: [
                {id: 'homeTab', type: 'item', label: 'Home', icon: 'home'},
                {id: 'settingsTab', type: 'item', label: 'Settings', icon: 'settings'},
                {id: 'addSongsTab', type: 'item', label: 'Add Songs', icon: 'add'},
                {id: 'libraryLabel', type: 'label', label: 'Library'},
                {id: 'likedTab', type: 'item', label: 'Liked Songs', icon: 'favorite_border'},
                {id: 'allTab', type: 'item', label: 'All Songs', icon: 'music_note'},
                {id: 'artistsTab', type: 'item', label: 'Artists', icon: 'person'},
                {id: 'albumsTab', type: 'item', label: 'Albums', icon: 'album'},
                {id: 'playlistLabel', type: 'label', label: 'Playlists'},
                //{id: 'playlistsList', type: 'list', items: [{id: 'test', label: 'test label'}]}
            ]
        }
    },
    methods: {
        click(evt, item) {
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
                    mainSongListComp.$mount('.tab-container');
                    currentView = "All Songs";
                    if (currentIndex) {
                        updateActive();
                    }
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
                    let usedArtists = [];
                    fetch(`http://${hostnamePort}/api/albums`).then(resp => {
                        resp.json().then(albums => {
                            sortArray(albums, "name");
                            albums.forEach((f, i) => {
                                album.albumList.push({id: i, name: f.name, artist: f.artist});
                            });
                        })
                    })
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
                            console.log(artists)
                            artists.forEach((f, i) => {
                                console.log(f)
                                artist.artistList.push({id: i, artist: f.artist});
                            });
                        })
                    })
                    artist.$mount('.tab-container');
                    mountedTab = artistTab;
                    currentView = "Artists"
                    break;
                default:
                    let missingTab = new noTab;
                    missingTab.$mount('.tab-container');
                    mountedTab = noTab;
                    currentView = "Unknown"
            }
            let indicator = document.querySelector('.active-indicator');
            indicator.style.height = evt.target.getBoundingClientRect().height + 'px';
            indicator.style.top = evt.target.getBoundingClientRect().top + document.querySelector('.sidebar').scrollTop + 'px';
        },
        active(evt) {

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
                    })
                    mainSongListComp.$mount('.tab-container');
                    currentView = `pl-${this.plitem.label}`;
                    tabName.showButtons(true, null, null, pl.imgData, false);
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
            title: 'Home'
        }
    },
    methods: {
        async showButtons(showAlbumArt, album, artist, dataurl, showBack) {
            if (showBack) {
                document.querySelector('#tabBackButton').style.display = 'block';
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
            }
        },
        hideButtons() {
            document.querySelector('#tabBackButton').style.display = 'none';
            document.querySelector('.tab-album-art').style.display = 'none';
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
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
                        }
                        sortArray(mainSongListComp.songs, 'title');
                        setTimeout(() => {
                            document.querySelector('.cover').style.opacity = 0;
                            document.body.style.overflow = "auto";
                            setTimeout(() => {
                                document.querySelector('.cover').style.display = 'none'
                            }, 250)
                        }, 350)
                    });
                    tabName.showButtons(true, album, artist, null, true);
                    tabName.title = album;
                    mainSongListComp.$mount('.tab-container');
                    currentView = `album-${album}`;
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
    template: '<div class="context-item" v-on:click="click">{{ list.name }}</div>',
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
                        })
                    })
                    break;
                case "editPlaylist":
                    popup.open('editPL');
                    break;
                case "rmSongPlaylist":
                    
            }
        }
    }
});

let highlightedSongs = [];
let hlLastClick = 0;

ctxListSong = [
    {name: 'Add to playlist', id: 'addPlaylist'},
    {name: 'Remove from library', id: 'removeFromLibrary'}
]

ctxListPlaylist = [
    {name: 'Edit Playlist', id: 'editPlaylist'},
    {name: 'Remove Playlist', id: 'removePlaylist'}
]

ctxPlaylistItems = [
    {name: 'Remove from playlist', id: 'rmSongPlaylist'},
    {name: 'Remove from library', id: 'removeFromLibrary'}
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
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
                        }
                        sortArray(mainSongListComp.songs, 'album');
                    });
                    mainSongListComp.$mount('.tab-container')
                    currentView = `artist-${artist}`;
                    tabName.title = artist;
                    tabName.showButtons(false, null, null, null, true);
                    updateActive();
                    mountedTab = mainSongListComp;
                })
            })
        }
    }
});

