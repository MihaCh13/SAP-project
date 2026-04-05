package com.sap.project;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Scanner;

public class ConsoleClient {

    private static final String API_URL = "http://localhost:8080/api";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static final Scanner scanner = new Scanner(System.in);

    // Session variables
    private static Integer loggedInUserId = null;
    private static String loggedInUsername = null;
    private static String loggedInRoles = "";

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("    SAP SECURE DOCUMENT MANAGER (v2)    ");
        System.out.println("========================================");

        while (true) {
            if (loggedInUserId == null) {
                showLoginMenu();
            } else {
                showMainMenu();
            }
        }
    }

    private static void showLoginMenu() {
        System.out.println("\n--- SYSTEM LOGIN ---");
        System.out.println("1. Login");
        System.out.println("0. Exit");
        System.out.print("Select option: ");
        
        String choice = scanner.nextLine();
        if (choice.equals("1")) performLogin();
        else if (choice.equals("0")) {
            System.out.println("Goodbye!");
            System.exit(0);
        } else {
            System.out.println(">>> INVALID OPTION!");
        }
    }

    private static void showMainMenu() {
    	checkNotifications(); // <-- ДОБАВЯМЕ ТОВА ТУК!
        boolean isAdmin = loggedInRoles.contains("ADMIN");
        boolean isAuthor = loggedInRoles.contains("AUTHOR");
        boolean isReviewer = loggedInRoles.contains("REVIEWER");

        System.out.println("\n--- MAIN MENU | User: " + loggedInUsername + " [" + loggedInRoles + "] ---");
        
        System.out.println("1. View all documents");
        System.out.println("2. View document history");
        
        if (isAuthor) {
            System.out.println("3. [Author] Create new document");
            System.out.println("4. [Author] Edit (Create new version)");
            System.out.println("5. [Author] Submit for review");
        }
        if (isReviewer) {
            System.out.println("6. [Reviewer] Approve version");
            System.out.println("7. [Reviewer] Reject version");
        }
        if (isAdmin) {
            System.out.println("8. [Admin] Register new user");
            System.out.println("9. [Admin] Add role to existing user"); // <-- НОВАТА ОПЦИЯ
        }
        
        System.out.println("10. [Export] Download TXT or PDF");
        System.out.println("0. Logout");
        System.out.print("Select action: ");

        String choice = scanner.nextLine();

        // 1. ПОПРАВКА НА ПРОБЛЕМА С ДОСТЪПА: Вече извежда съобщение при грешна роля!
        switch (choice) {
            case "1": showAllDocuments(); break;
            case "2": showHistory(); break;
            case "3": if(isAuthor) createDoc(); else printDenied("AUTHOR"); break;
            case "4": if(isAuthor) editDoc(); else printDenied("AUTHOR"); break;
            case "5": if(isAuthor) submitDoc(); else printDenied("AUTHOR"); break;
            case "6": if(isReviewer) approveDoc(); else printDenied("REVIEWER"); break;
            case "7": if(isReviewer) rejectDoc(); else printDenied("REVIEWER"); break;
            case "8": if(isAdmin) registerUser(); else printDenied("ADMIN"); break;
            case "10": exportMenu(); break;
            case "9": if(isAdmin) addRole(); else printDenied("ADMIN"); break;
            case "0": 
                loggedInUserId = null; loggedInUsername = null; loggedInRoles = ""; 
                System.out.println(">>> Successfully logged out."); break;
            default: System.out.println(">>> INVALID OPTION!");
        }
    }

    private static void printDenied(String requiredRole) {
        System.out.println("\n[ACCESS DENIED]: You need the '" + requiredRole + "' role to perform this action.");
    }

    private static void performLogin() {
        System.out.print("Username: "); String username = scanner.nextLine();
        System.out.print("Password: "); String password = scanner.nextLine();

        String json = String.format("{\"username\":\"%s\",\"password\":\"%s\"}", username, password);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/users/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                loggedInUserId = Integer.parseInt(body.split("\"userId\":")[1].split(",")[0].replaceAll("[^0-9]", ""));
                loggedInUsername = body.split("\"username\":\"")[1].split("\"")[0];
                loggedInRoles = body.split("\"roles\":\"")[1].split("\"")[0];
                
                System.out.println("\n>>> LOGIN SUCCESSFUL! Welcome, " + loggedInUsername);
            } else {
                System.out.println("\n[ERROR]: " + response.body());
            }
        } catch (Exception e) {
            System.out.println("[ERROR] Could not connect to server: " + e.getMessage());
        }
    }

    private static void showAllDocuments() {
        System.out.println("\n--- ALL DOCUMENTS ---");
        String response = sendRequest("GET", "/documents", null);
        printPrettyJson(response);
    }

    private static void showHistory() {
        System.out.print("Enter Document ID: "); String docId = scanner.nextLine();
        System.out.println("\n--- DOCUMENT TIMELINE (ID: " + docId + ") ---");
        
        String response = sendRequest("GET", "/documents/" + docId + "/history", null);
        
        // Ако има грешка (напр. Access Denied), тя няма да започва с "[" (което е JSON масив)
        if (!response.trim().startsWith("[")) {
            System.out.println("[SERVER]: " + response);
            return;
        }

        try {
            // Изчистваме масива и разделяме обектите
            String[] versions = response.replace("[", "").replace("]", "").split("},\\{");
            
            for (String v : versions) {
                // Изчистваме кавичките и скобите за конкретната версия
                String clean = v.replace("{", "").replace("}", "").replace("\"", "");
                
                System.out.println("┌──────────────────────────────────────┐");
                
                // Разделяме полетата (Version, Status, Author, Preview)
                String[] fields = clean.split(",");
                for (String field : fields) {
                    String[] kv = field.split(":");
                    if (kv.length >= 2) {
                        String key = kv[0].trim();
                        // Събираме стойността обратно (в случай, че в Preview е имало запетая или двоеточие)
                        String value = field.substring(field.indexOf(":") + 1).trim(); 
                        System.out.printf("│ %-10s : %s\n", key, value);
                    }
                }
                System.out.println("└──────────────────────────────────────┘");
            }
        } catch (Exception e) {
            System.out.println("Error formatting history: " + response);
        }
    }

    // 2. ПОПРАВКА НА ГРОЗНИЯ JSON: Този метод превръща масивите в красиви списъци
    private static void printPrettyJson(String json) {
        if (json == null || json.isEmpty() || json.equals("[]")) {
            System.out.println("   No records found.");
            return;
        }
        
        try {
            // Премахваме скобите на масива и разделяме обектите
            String[] items = json.replace("[", "").replace("]", "").split("},\\{");
            for (String item : items) {
                // Изчистваме кавичките и скобите
                String cleanItem = item.replace("{", "").replace("}", "").replace("\"", "");
                // Заменяме запетаите с хубав разделител
                System.out.println(" * " + cleanItem.replace(",", " | "));
            }
        } catch (Exception e) {
            // Ако нещо се обърка, показваме суровия отговор за сигурност
            System.out.println("Raw response: " + json);
        }
    }

    private static void registerUser() {
        System.out.println("\n--- REGISTER NEW USER ---");
        System.out.print("Username: "); String uName = scanner.nextLine();
        System.out.print("Email: "); String email = scanner.nextLine();
        System.out.print("Password: "); String pass = scanner.nextLine();
        System.out.print("Roles (comma-separated: AUTHOR,REVIEWER,ADMIN,READER): "); 
        String role = scanner.nextLine().toUpperCase();

        String json = String.format("{\"username\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"role\":\"%s\"}", 
                                    uName, email, pass, role);
        String res = sendRequest("POST", "/users/register", json);
        System.out.println("\n[SERVER]: " + res);
    }

    private static void createDoc() {
        System.out.println("\n--- CREATE NEW DOCUMENT ---");
        System.out.print("Document Title: "); String title = scanner.nextLine();
        System.out.print("Description: "); String desc = scanner.nextLine();
        System.out.print("Initial Content: "); String content = scanner.nextLine(); // <-- ПИТАМЕ ЗА ТЕКСТА
        
        String json = String.format("{\"title\":\"%s\",\"description\":\"%s\",\"content\":\"%s\"}", title, desc, content);
        String res = sendRequest("POST", "/documents", json);
        System.out.println("\n[SERVER]: " + res);
    }

    private static void editDoc() {
        System.out.print("Document ID to edit: "); String docId = scanner.nextLine();
        System.out.print("New content for this version: "); String newContent = scanner.nextLine();
        String res = sendRequest("POST", "/documents/" + docId + "/versions", newContent);
        System.out.println("\n[SERVER]: " + res);
    }

    private static void submitDoc() {
        System.out.print("Version ID to submit: "); String vId = scanner.nextLine();
        String res = sendRequest("POST", "/documents/versions/" + vId + "/submit", "");
        System.out.println("\n[SERVER]: " + res);
    }

    private static void approveDoc() {
        System.out.print("Version ID to approve: "); String vId = scanner.nextLine();
        System.out.print("Comment (leave empty if none): "); String comment = scanner.nextLine();
        
        String path = "/documents/versions/" + vId + "/approve";
        if (!comment.isBlank()) {
            path += "?comment=" + java.net.URLEncoder.encode(comment, java.nio.charset.StandardCharsets.UTF_8);
        }
        String res = sendRequest("PUT", path, "");
        System.out.println("\n[SERVER]: " + res);
    }

    private static void rejectDoc() {
        System.out.print("Version ID to reject: "); String vId = scanner.nextLine();
        System.out.print("Reason (leave empty if none): "); String comment = scanner.nextLine();
        
        String path = "/documents/versions/" + vId + "/reject";
        if (!comment.isBlank()) {
            path += "?comment=" + java.net.URLEncoder.encode(comment, java.nio.charset.StandardCharsets.UTF_8);
        }
        String res = sendRequest("POST", path, "");
        System.out.println("\n[SERVER]: " + res);
    }
    private static void exportMenu() {
        System.out.print("Version ID to export: "); String vId = scanner.nextLine();
        System.out.print("Format (txt / pdf): "); String type = scanner.nextLine().toLowerCase();
        
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/documents/versions/" + vId + "/" + type))
                    .header("X-User-Id", loggedInUserId.toString()).GET().build();
            
            // 1. Вземаме отговора в паметта (като масив от байтове), вместо веднага да правим файл
            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
            
            // 2. Проверяваме дали сървърът ни е разрешил (Status 200)
            if (response.statusCode() == 200) {
                Path path = Paths.get("exported_doc_v" + vId + "." + type);
                java.nio.file.Files.write(path, response.body()); // Записваме байтовете във файл
                System.out.println("\n>>> File saved successfully to: " + path.toAbsolutePath());
            } else {
                // 3. Ако сървърът е върнал грешка (напр. 403 Forbidden или 400 Bad Request),
                // превръщаме байтовете обратно в текст и ги показваме!
                String errorMessage = new String(response.body(), java.nio.charset.StandardCharsets.UTF_8);
                System.out.println("\n[SERVER ERROR]: " + errorMessage);
            }
            
        } catch (Exception e) {
            System.out.println("\n[ERROR] Export failed: " + e.getMessage());
        }
    }

    // Променихме този метод да връща String, за да можем да форматираме резултата горе
    private static String sendRequest(String method, String path, String body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + path))
                    .header("X-User-Id", loggedInUserId != null ? loggedInUserId.toString() : "1"); 

            if (body != null && !body.isEmpty()) {
                builder.header("Content-Type", "application/json")
                       .method(method, HttpRequest.BodyPublishers.ofString(body));
            } else {
                builder.method(method, HttpRequest.BodyPublishers.noBody());
            }

            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            return "Connection Error: " + e.getMessage();
        }
    }
    private static void addRole() {
        System.out.println("\n--- ADD ROLE TO EXISTING USER ---");
        System.out.print("Target Username: "); String uName = scanner.nextLine();
        System.out.print("Roles to add (comma-separated): "); String roles = scanner.nextLine().toUpperCase();

        String json = String.format("{\"username\":\"%s\",\"roles\":\"%s\"}", uName, roles);
        String res = sendRequest("POST", "/users/add-role", json);
        System.out.println("\n[SERVER]: " + res);
    }
    private static void checkNotifications() {
        String response = sendRequest("GET", "/notifications", null);
        
        // Ако отговорът не е празен масив "[]" и не е грешка, значи имаме нови известия!
        if (response != null && !response.trim().equals("[]") && response.startsWith("[")) {
            System.out.println("\n========================================");
            System.out.println(" 🔔 YOU HAVE NEW NOTIFICATIONS! 🔔");
            System.out.println("========================================");
            printPrettyJson("\n" + response); // Използваме стария ни метод за красиво форматиране
            System.out.println("========================================");
        }
    }
}