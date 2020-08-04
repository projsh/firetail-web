package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import java.util.List;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.bson.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.projsh.firetailweb.Database;
import xyz.projsh.firetailweb.FiretailWeb;

@RestController
@RequestMapping("/api")
public class Api {
    
    @GetMapping("/getAllSongs")
    public Set<GetSong> getAllSongs() {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
        }
        return files;
    }
    
    @GetMapping("/getAllAlbums")
    public Set<AllAlbums> getAllAlbums() {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllAlbums> albums = new HashSet<>();
        Map<String, Boolean> foundAlbum = new HashMap<String, Boolean>();
        for (Document song : songs) {
            try {
                if (!foundAlbum.get(song.getString("album"))) {
                    if (!song.getString("album").equals(null)) {
                        albums.add(new AllAlbums(song.getString("album"), song.getString("artist")));
                        foundAlbum.put(song.getString("album"), true);
                    }
                }
            } catch(NullPointerException err) {
                try {
                    if (!song.getString("album").equals(null)) {
                        albums.add(new AllAlbums(song.getString("album"), song.getString("artist")));
                        foundAlbum.put(song.getString("album"), true);
                    }
                } catch(NullPointerException err1) {};
            }
        }
        return albums;
    }
    
    @GetMapping("/getAlbum")
    public Set<GetSong> getAlbum(@RequestParam String album) {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            try {
                if (!song.getString("album").equals(null) && song.getString("album").equals(album)) {
                    System.out.println(song.getString("album"));
                    files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                }
            } catch(NullPointerException err) {
                //System.out.println(err.getMessage());
            }
        }
        return files;
    }
    
    @GetMapping("/restart")
    public void restart() {
        Thread restartThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
                FiretailWeb.restart();
                
            } catch (InterruptedException err) {
            
            }
        });
        restartThread.setDaemon(false);
        restartThread.start();
    }
    
}