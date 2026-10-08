import java.util.ArrayList;

/**
 * Prediction.java - Predicts future energy consumption
 * Uses Moving Average + Trend Adjustment (NO machine learning)
 * Easy to explain in a viva
 */
public class Prediction {
    private ArrayList<Double> historicalData; // Monthly consumption history

    public Prediction() {
        historicalData = new ArrayList<>();
    }

    // Add a month's consumption data
    public void addMonthlyData(double consumption) {
        if (consumption < 0) {
            throw new IllegalArgumentException("Consumption cannot be negative");
        }
        historicalData.add(consumption);
    }

    public ArrayList<Double> getHistoricalData() {
        return historicalData;
    }

    /**
     * Predict next month's consumption using Moving Average + Trend
     *
     * Algorithm (simple, no ML):
     * 1. Calculate average of last 3 months
     * 2. Find trend = last month - second-to-last month
     * 3. Predicted = average + (trend × 0.5)
     *
     * Example:
     *   Oct = 420, Nov = 370, Dec = 310
     *   Average = (420 + 370 + 310) / 3 = 366.7
     *   Trend = 310 - 370 = -60
     *   Predicted = 366.7 + (-60 × 0.5) = 336.7 kWh
     */
    public double predictNextMonth() {
        int n = historicalData.size();
        if (n < 3) {
            System.out.println("Need at least 3 months of data for prediction");
            return 0;
        }

        // Step 1: Average of last 3 months
        double sum = 0;
        for (int i = n - 3; i < n; i++) {
            sum += historicalData.get(i);
        }
        double average = sum / 3.0;

        // Step 2: Calculate trend
        double trend = historicalData.get(n - 1) - historicalData.get(n - 2);

        // Step 3: Predicted = average + trend adjustment
        double predicted = average + (trend * 0.5);

        return Math.max(0, predicted); // Can't be negative
    }

    /**
     * Predict the bill based on predicted consumption and tariff
     */
    public double predictBill(double tariff) {
        return predictNextMonth() * tariff;
    }

    /**
     * Calculate confidence level based on data variation
     * Less variation = higher confidence
     */
    public String getConfidenceLevel() {
        int n = historicalData.size();
        if (n < 3) return "Low (insufficient data)";

        // Look at variation in last 3 months
        double d1 = historicalData.get(n - 3);
        double d2 = historicalData.get(n - 2);
        double d3 = historicalData.get(n - 1);
        double avg = (d1 + d2 + d3) / 3.0;

        double max = Math.max(d1, Math.max(d2, d3));
        double min = Math.min(d1, Math.min(d2, d3));
        double variation = ((max - min) / avg) * 100;

        if (variation < 10)  return "High (>90%)";
        if (variation < 20)  return "Moderate (75-90%)";
        return "Low (<75%)";
    }

    /**
     * Get expected change from last month
     */
    public double getExpectedChange() {
        int n = historicalData.size();
        if (n < 3) return 0;
        return predictNextMonth() - historicalData.get(n - 1);
    }
}
