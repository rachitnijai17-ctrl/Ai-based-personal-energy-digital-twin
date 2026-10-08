import java.util.ArrayList;
import java.util.HashMap;

/**
 * Main.java - Entry point for Smart Energy Monitoring System
 * Demonstrates all OOP concepts: Encapsulation, Inheritance, Polymorphism, Collections
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println(" Smart Energy Monitoring System");
        System.out.println(" Prediction & Recommendation");
        System.out.println("========================================\n");

        // ---- 1. Create Appliances (Encapsulation) ----
        System.out.println("--- Creating Appliances ---");
        ArrayList<Appliance> appliances = new ArrayList<>();

        // Using Appliance class directly
        appliances.add(new Appliance(2, "Refrigerator", "Cooling", "Kitchen", 200, 24, 24));
        appliances.add(new Appliance(3, "Fan", "Ventilation", "Bedroom", 75, 8, 7.5));
        appliances.add(new Appliance(4, "LED Light", "Lighting", "Study Room", 12, 6, 6.2));
        appliances.add(new Appliance(5, "TV", "Electronics", "Living Room", 100, 4, 5));
        appliances.add(new Appliance(6, "Computer", "Electronics", "Study Room", 250, 6, 5.5));

        // ---- 2. Inheritance + Polymorphism ----
        // AC is a subclass of Appliance
        // Polymorphism: Appliance reference pointing to AC object
        AC ac = new AC(1, "Living Room", 1500, 6, 8.5);
        ac.setTemperature(28);  // Weather data
        ac.setHumidity(55);
        Appliance acAsAppliance = ac; // Polymorphism!
        appliances.add(0, acAsAppliance); // Add at beginning

        System.out.println("Created " + appliances.size() + " appliances:\n");
        for (int i = 0; i < appliances.size(); i++) {
            System.out.println("  " + appliances.get(i));
        }

        // ---- 3. Energy Calculations ----
        System.out.println("\n--- Energy Calculations ---");
        EnergyCalculator calculator = new EnergyCalculator(8.0); // ₹8/kWh

        double totalExpected = calculator.calculateExpectedConsumption(appliances);
        double totalActual = calculator.calculateActualConsumption(appliances);
        double deviation = calculator.calculateDeviation(appliances);
        double dailyCost = calculator.calculateCost(totalActual);
        double monthlyCost = dailyCost * 30;

        System.out.println("  Total Expected: " + String.format("%.2f", totalExpected) + " kWh/day");
        System.out.println("  Total Actual:   " + String.format("%.2f", totalActual) + " kWh/day");
        System.out.println("  Deviation:      " + String.format("%.1f", deviation) + "%");
        System.out.println("  Daily Cost:     ₹" + String.format("%.2f", dailyCost));
        System.out.println("  Monthly Cost:   ₹" + String.format("%.0f", monthlyCost));

        // Unaccounted consumption
        double meterReading = 27.4; // kWh
        double unaccounted = calculator.calculateUnaccountedConsumption(meterReading, appliances);
        System.out.println("  Meter Reading:  " + meterReading + " kWh");
        System.out.println("  Unaccounted:    " + String.format("%.2f", unaccounted) + " kWh");

        // ---- 4. Energy Data & Room Consumption (Collections) ----
        System.out.println("\n--- Room-wise Consumption ---");
        EnergyData energyData = new EnergyData();
        energyData.calculateRoomConsumption(appliances);

        HashMap<String, Double> roomData = energyData.getAllRoomConsumption();
        for (String room : roomData.keySet()) {
            System.out.println("  " + room + ": " + String.format("%.2f", roomData.get(room)) + " kWh");
        }

        // ---- 5. Predictions (Moving Average + Trend) ----
        System.out.println("\n--- Predictions ---");
        Prediction prediction = new Prediction();
        // Add historical monthly data
        double[] history = {410, 390, 420, 380, 350, 370, 310};
        for (int i = 0; i < history.length; i++) {
            prediction.addMonthlyData(history[i]);
        }

        double predicted = prediction.predictNextMonth();
        double predictedBill = prediction.predictBill(calculator.getTariff());
        System.out.println("  Predicted next month: " + String.format("%.0f", predicted) + " kWh");
        System.out.println("  Predicted bill:       ₹" + String.format("%.0f", predictedBill));
        System.out.println("  Confidence:           " + prediction.getConfidenceLevel());
        System.out.println("  Change from last:     " + String.format("%+.0f", prediction.getExpectedChange()) + " kWh");

        // ---- 6. AC Context Analysis (Polymorphism in action) ----
        System.out.println("\n--- AC Context Analysis ---");
        System.out.println("  " + ac.analyzeConsumption());

        // ---- 7. Recommendations ----
        System.out.println("\n--- Smart Recommendations ---");
        Recommendation rec = new Recommendation(appliances, 8000, predictedBill);
        ArrayList<String> recommendations = rec.generateRecommendations();
        for (int i = 0; i < recommendations.size(); i++) {
            System.out.println("  " + (i + 1) + ". " + recommendations.get(i));
        }

        // ---- 8. Health Scoring ----
        System.out.println("\n--- Appliance Health ---");
        for (int i = 0; i < appliances.size(); i++) {
            Appliance a = appliances.get(i);
            double dev = Math.abs(a.calculateDeviation());
            String status;
            if (dev <= 10)      status = "Good";
            else if (dev <= 20) status = "Monitor";
            else if (dev <= 30) status = "Warning";
            else                status = "Possible Fault";

            // Calculate health score (100 minus deviation, min 0)
            double score = Math.max(0, 100 - (dev * 2));
            a.setHealthScore(score);
            a.setStatus(status);

            System.out.println("  " + a.getName() + ": " + String.format("%.0f", score)
                             + "/100 [" + status + "]");
        }

        // ---- 9. Exception Handling Demo ----
        System.out.println("\n--- Exception Handling Demo ---");
        try {
            Appliance bad = new Appliance(99, "Bad", "Test", "Room", -100, 5, 5);
        } catch (IllegalArgumentException e) {
            System.out.println("  Caught: " + e.getMessage());
        }

        try {
            Appliance bad2 = new Appliance(99, "Bad", "Test", "Room", 100, 30, 5);
        } catch (IllegalArgumentException e) {
            System.out.println("  Caught: " + e.getMessage());
        }

        // ---- 10. Database Demo (optional - needs MySQL) ----
        System.out.println("\n--- Database Connection ---");
        Database db = new Database();
        System.out.println("  To test database, install MySQL and run schema.sql");
        System.out.println("  Then uncomment the database section in Main.java");
        // Uncomment below to test with MySQL:
        // db.connect();
        // if (db.isConnected()) {
        //     ArrayList<Appliance> dbAppliances = db.getAppliances();
        //     System.out.println("  Loaded " + dbAppliances.size() + " appliances from DB");
        //     db.close();
        // }

        System.out.println("\n========================================");
        System.out.println(" System running successfully!");
        System.out.println(" Open frontend/dashboard.html in browser");
        System.out.println("========================================");
    }
}
