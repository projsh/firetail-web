package xyz.projsh.firetailweb;

import xyz.projsh.firetailweb.ui.MainUI;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootApplication
@EnableWebMvc
public class FiretailWeb {
    
    private static String[] args;
    private static ConfigurableApplicationContext context;
    
    public static String versionString = "v0.2.0";
    
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
        new Database();
	FiretailWeb.args = args;
        FiretailWeb.context = SpringApplication.run(FiretailWeb.class, args);
	System.setProperty("java.awt.headless", "false");
        System.out.println(args.length);
	if (args.length > 0) {
            if (args[0].equals("-no-gui")) {
                
            } else {
                java.awt.EventQueue.invokeLater(new Runnable() {
                    public void run() {
                        new MainUI().setVisible(true);
                    }
                });
            }
        } else {
            java.awt.EventQueue.invokeLater(new Runnable() {
                public void run() {
                    new MainUI().setVisible(true);
                }
            });
        }
    }

}
