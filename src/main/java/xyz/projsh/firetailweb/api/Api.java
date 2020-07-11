package xyz.projsh.firetailweb.api;

import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
    
    private String[] fileExts = {".mp3", ".flac", ".m4a", ".acc", ".wav", ".ogg"};
    
    private Set<String> listFilesUsingDirectoryStream(String dir) throws IOException {
        Set<String> fileList = new HashSet<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(dir))) {
            for (Path path : stream) {
                String ext = getFileExtension(new File(path.getFileName().toString()));
                if (!Files.isDirectory(path) && Arrays.asList(fileExts).indexOf(ext) != -1) {
                    fileList.add(path.getFileName().toString());
                }
            }
        }
        return fileList;
    }
    
    @GetMapping("/getfiles")
    public Set<String> getFiles() throws IOException {
        Set<String> lol = listFilesUsingDirectoryStream(FiretailWeb.musLoc);
        return lol;
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