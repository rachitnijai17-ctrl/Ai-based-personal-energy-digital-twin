import java.util.ArrayList;

/**
 * Recommendation.java - Generates energy saving recommendations
 * Based on actual appliance data, not generic tips
 */
public class Recommendation {
    private ArrayList<Appliance> appliances;
    private double totalConsumption;
    private double monthlyBudget;
    private double predictedBill;

    public Recommendation(ArrayList<Appliance> appliances, double monthlyBudget,
                          double predictedBill) {
        this.appliances = appliances;
        this.monthlyBudget = monthlyBudget;
        this.predictedBill = predictedBill;

        // Calculate total consumption
        this.totalConsumption = 0;
        for (int i = 0; i < appliances.size(); i++) {
            totalConsumption += appliances.get(i).calculateActualConsumption();
        }
    }

    /**
     * Generate all recommendations based on current data
     */
    public ArrayList<String> generateRecommendations() {
        ArrayList<String> recs = new ArrayList<>();

        // Check each appliance
        for (int i = 0; i < appliances.size(); i++) {
            Appliance a = appliances.get(i);
            double deviation = a.calculateDeviation();
            double percentage = 0;
            if (totalConsumption > 0) {
                percentage = (a.calculateActualConsumption() / totalConsumption) * 100;
            }

            // AC-specific recommendations
            if (a.getName().equals("AC")) {
                recs.add("Your AC accounts for " + String.format("%.0f", percentage)
                       + "% of today's energy consumption. "
                       + "Consider setting temperature between 24-26°C.");
                if (deviation > 15) {
                    recs.add("AC consumption is " + String.format("%.0f", deviation)
                           + "% higher than expected. Check if filters need cleaning.");
                }
            }

            // TV recommendation
            if (a.getName().equals("TV") && a.getActualHours() > a.getExpectedHours()) {
                recs.add("Consider reducing TV usage during inactive hours. "
                       + "Current: " + a.getActualHours() + "h vs expected "
                       + a.getExpectedHours() + "h.");
            }

            // Refrigerator recommendation
            if (a.getName().equals("Refrigerator") && deviation > 10) {
                recs.add("Refrigerator has shown higher-than-normal consumption. "
                       + "Check door seals and temperature settings.");
            }

            // General high deviation
            if (deviation > 25 && !a.getName().equals("AC")) {
                recs.add(a.getName() + " is consuming " + String.format("%.0f", deviation)
                       + "% more than expected. Consider getting it inspected.");
            }
        }

        // Budget warning
        if (predictedBill > monthlyBudget) {
            double over = predictedBill - monthlyBudget;
            recs.add("You may exceed your monthly energy budget by approximately ₹"
                   + String.format("%.0f", over) + ". Consider reducing usage.");
        }

        return recs;
    }
}
