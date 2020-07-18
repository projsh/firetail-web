package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import static com.mongodb.client.model.Filters.eq;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;
import javax.servlet.http.HttpServletResponse;
import org.bson.Document;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
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
    
    @GetMapping("/getAllSongs")
    public Set<AllSongs> getAllSongs() throws IOException {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllSongs> files = new HashSet<>();
        for (Document song : songs) {
            files.add(new AllSongs(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
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
    
    @PostMapping("/getFileNew")
    public ResponseEntity<InputStreamResource> getFileNew(@RequestBody String file, final HttpServletResponse response) throws IOException {
        FindIterable<Document> songs = Database.songs.find(eq("fileName", file));
        String fileLoc = "";
        for (Document song : songs) {
            System.out.println(file + " || " + song.getString("location"));
            fileLoc = song.getString("location");
            break;
        }
        File songFile = new File(fileLoc);
        InputStreamResource resource = new InputStreamResource(new FileInputStream(songFile));
        response.setContentType("audio/mp3");
        return new ResponseEntity(resource, HttpStatus.OK);
    }
    
    @GetMapping("/streamFile")
    @ResponseBody
    public ResponseEntity<StreamingResponseBody> streamFile(@RequestParam String file, final HttpServletResponse response) {
        response.setContentType("audio/mp3");
        response.setHeader(
                "Content-Disposition",
                "attachment;filename=test.mp3");
        StreamingResponseBody stream = out -> {
            FindIterable<Document> songs = Database.songs.find(eq("fileName", file));
            for (Document song : songs) {
                System.out.println(file + " || " + song.getString("location"));
                File songFile = new File(song.getString("location"));
                final OutputStream outputStream = response.getOutputStream();
                try {
                    final InputStream inputStream = new FileInputStream(songFile);
                    byte[] bytes = new byte[1024];
                    int length;
                    while ((length = inputStream.read(bytes)) >= 0) {
                        outputStream.write(bytes, 0, length);
                    }
                    inputStream.close();
                    outputStream.close();
                } catch (final IOException err) {
                    
                }
                break;
            }
        };
        return new ResponseEntity(stream, HttpStatus.OK);
    }
    
}