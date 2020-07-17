package xyz.projsh.firetailweb;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import static com.mongodb.client.model.Filters.eq;
import com.mpatric.mp3agic.ID3v2;
import com.mpatric.mp3agic.InvalidDataException;
import com.mpatric.mp3agic.Mp3File;
import com.mpatric.mp3agic.UnsupportedTagException;
import de.odysseus.ithaka.audioinfo.AudioInfo;
import de.odysseus.ithaka.audioinfo.m4a.M4AInfo;
import de.odysseus.ithaka.audioinfo.mp3.MP3Info;
import java.awt.Image;
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
import javax.swing.ImageIcon;
import org.bson.Document;

public class Database {

    public MongoClient mongodb;
    public MongoDatabase db;
    public static MongoCollection<Document> songs;
    public static MongoCollection<Document> userSettings;
    public static String dataDir;
    
    private static String[] getMetadata(String fileLoc) {
        String[] songMetadata = new String[3];
        File file = new File(fileLoc);
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
                /*byte[] img = audioInfo.getCover();
                if (img != null) {
                    ImageIcon icon = new ImageIcon(img);
                    Image image = icon.getImage();
                    Image scaledImg = image.getScaledInstance(128, 128, Image.SCALE_SMOOTH);
                    icon = new ImageIcon(scaledImg);
                    albumArtLabel.setIcon(icon);
                    albumArtLabel.setText("");
                }*/
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
        return songMetadata;
    }
    
    public Database() {
        //connect to mongodb. if firetailweb db doesn't exist, mongodb will auto create it
        mongodb = MongoClients.create("mongodb://localhost:27017");
        db = mongodb.getDatabase("firetailweb");
        songs = db.getCollection("songs");
        userSettings = db.getCollection("settings");
        try {
            dataDir = userSettings.find().first().getString("userDir");
        } catch(NullPointerException err) {
            new File(String.format("%s/.firetail-web/songs", System.getProperty("user.home"))).mkdirs();
            Document newSettings = new Document("userDir", String.format("%s/.firetail-web/songs/", System.getProperty("user.home")));
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
        String[] songMetadata = getMetadata(fileLoc);
        Document newSong = new Document("title", songMetadata[0])
                .append("artist", songMetadata[1])
                .append("album", songMetadata[2])
                .append("location", fileLoc)
                .append("fileName", file.getName());
        songs.insertOne(newSong);
    }

}
