package xyz.projsh.firetailweb;

import xyz.projsh.firetailweb.ui.MainUI;
import com.formdev.flatlaf.FlatDarculaLaf;
import com.mongodb.client.MongoClient;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.swing.SwingUtilities;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootApplication
@EnableWebMvc
public class FiretailWeb {
    
    private static String[] args;
    private static ConfigurableApplicationContext context;
    public static boolean firstLaunch = false;
    
    public static void doRestart() {
        try {
            URL url = new URL("http://localhost:8080/api/restart");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            con.getInputStream();
            System.out.println("lol");
        } catch (Exception ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public static void restart() {
        context.close();
        FiretailWeb.context = SpringApplication.run(FiretailWeb.class, args);
    }
    
    public static void main(String[] args) {
        FlatDarculaLaf.install();
        new Database();
	FiretailWeb.args = args;
        FiretailWeb.context = SpringApplication.run(FiretailWeb.class, args);
	System.setProperty("java.awt.headless", "false");
	if (!firstLaunch) {
            SwingUtilities.invokeLater(() -> {
                new MainUI().setVisible(true);
            });
        }
    }

}
