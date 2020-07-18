package xyz.projsh.firetailweb;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import static com.mongodb.client.model.Filters.eq;
import de.odysseus.ithaka.audioinfo.AudioInfo;
import de.odysseus.ithaka.audioinfo.m4a.M4AInfo;
import de.odysseus.ithaka.audioinfo.mp3.MP3Info;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.bson.Document;

public class Database {

    public MongoClient mongodb;
    public MongoDatabase db;
    public static MongoCollection<Document> songs;
    public static MongoCollection<Document> userSettings;
    public static String dataDir;
    public static String imgDir;
    
    public Database() {
        //connect to mongodb. if firetailweb db doesn't exist, mongodb will auto create it
        mongodb = MongoClients.create("mongodb://localhost:27017");
        db = mongodb.getDatabase("firetailweb");
        songs = db.getCollection("songs");
        userSettings = db.getCollection("settings");
        try {
            dataDir = userSettings.find().first().getString("userDir");
            imgDir = userSettings.find().first().getString("imgDir");
        } catch(NullPointerException err) {
            new File(String.format("%s/.firetail-web/songs", System.getProperty("user.home"))).mkdirs();
            File imgFile = new File(String.format("%s/.firetail-web/images", System.getProperty("user.home")));
            imgFile.mkdirs();
            Document newSettings = new Document("userDir", String.format("%s/.firetail-web/songs/", System.getProperty("user.home")))
                    .append("imgDir", imgFile.getAbsolutePath());
            userSettings.insertOne(newSettings);
            dataDir = userSettings.find().first().getString("userDir");
        }
    }
    
    public static String getSong(String id) {
        Document song = songs.find(eq("_id", id)).first();
        return song.toJson();
    }
    
    public static void addSong(File file) {
        String fileLoc = dataDir + "/" + file.getName();
        try {
            byte[] fileData = Files.readAllBytes(Paths.get(file.getAbsolutePath()));
            File newFile = new File(fileLoc);
            newFile.createNewFile();
            try {
                FileOutputStream writeFile = new FileOutputStream(newFile.getAbsolutePath());
                writeFile.write(fileData);
                writeFile.close();
                System.out.println("Wrote file! " + dataDir);
            } catch(IOException err) {
                System.out.println("Unable to save file...");
                err.printStackTrace();
            }
        } catch(IOException err) {
            
        }
        String[] songMetadata = new String[4];
        Thread getMetadata = new Thread(() -> {
            String name = file.getName();
            AudioInfo audioInfo = null;
            int lastIndexOf = name.lastIndexOf(".");
            try (InputStream input = new BufferedInputStream(new FileInputStream(file))) {
                if (name.substring(lastIndexOf).equals(".m4a")) {
                    audioInfo = new M4AInfo(input);
                } else {
                    audioInfo = new MP3Info(input, file.length());
                }
                songMetadata[0] = audioInfo.getTitle();
                songMetadata[1] = audioInfo.getArtist();
                songMetadata[2] = audioInfo.getAlbum();
                long dur = audioInfo.getDuration();
                System.out.println(dur);
                double min = Math.floor(dur / 60000);
                double sec = Math.floor((dur / 1000) - (min * 60));
                String secString = String.valueOf((int)sec);
                if (sec < 10) {
                    secString = String.format("0%s", secString);
                }
                songMetadata[3] = String.format("%s:%s", (int)min, secString);
                byte[] img = audioInfo.getCover();
                if (img != null) {
                    File imgFile = new File(String.format("%s/%s.jpg", imgDir, songMetadata[1] + songMetadata[2]));
                    imgFile.createNewFile();
                    FileOutputStream writeFile = new FileOutputStream(imgFile.getAbsolutePath());
                    writeFile.write(img);
                    writeFile.close();
                }
            } catch (Exception ex) {
                Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
                if (songMetadata[0] == null) {
                    songMetadata[0] = new File(fileLoc).getName();
                }
                if (songMetadata[1] == null) {
                    songMetadata[1] = "Unknown Artist";
                }
                if (songMetadata[2] == null) {
                    songMetadata[2] = "Unknown Album";
                }
            }
        });
        getMetadata.start();
        try {
            getMetadata.join();
        } catch (InterruptedException ex) {
            Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
        }
        Document newSong = new Document("title", songMetadata[0])
                .append("artist", songMetadata[1])
                .append("album", songMetadata[2])
                .append("location", fileLoc)
                .append("fileName", file.getName())
                .append("duration", songMetadata[3]);
        songs.insertOne(newSong);
    }

}
