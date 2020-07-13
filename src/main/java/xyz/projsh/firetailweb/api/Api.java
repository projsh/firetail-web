package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import org.bson.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.projsh.firetailweb.Database;
import xyz.projsh.firetailweb.FiretailWeb;

@RestController
@RequestMapping("/api")
public class Api {

    private String getFileExtension(File file) {
        String name = file.getName();
        int lastIndexOf = name.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return "";
        }
        return name.substring(lastIndexOf);
    }
    
    @GetMapping("/getfiles")
    public Set<String> getFiles() throws IOException {
        FindIterable<Document> songs = Database.songs.find();
        Set<String> files = new HashSet<>();
        for (Document song : songs) {
            files.add(song.getString("fileName"));
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
    
    @GetMapping("/currentDir")
    public String currentDir() {
        return FiretailWeb.musLoc;
    }
    
    @PostMapping("/updateLoc")
    public void updateLoc(@RequestBody String dir) {
        FiretailWeb.musLoc = dir;
        FiretailWeb.doRestart();
    }
    
}