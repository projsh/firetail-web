package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import static com.mongodb.client.model.Filters.eq;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
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
    
    @PostMapping("/getFile")
    public byte[] getFile(@RequestBody String file) throws IOException {
        FindIterable<Document> songs = Database.songs.find(eq("fileName", file));
        String dir = "";
        for (Document song : songs) {
            System.out.println(file + " || " + song.getString("location"));
            dir = new File(song.getString("location")).getAbsolutePath();
            break;
        }
        return Files.readAllBytes(Paths.get(dir));
    }
    
}