# Smart Energy Monitoring, Prediction & Recommendation System

A comprehensive energy monitoring system that tracks appliance consumption, detects anomalies, predicts future usage, and provides smart recommendations.

## 🎯 Project Objective

Build a Smart Energy Monitoring System using Core Java OOP concepts and a web-based dashboard to:
- Monitor energy consumption of appliances in real-time
- Detect unusual consumption patterns (anomalies)
- Predict future energy bills using Moving Average method
- Generate smart recommendations for energy saving
- Track appliance health over time
- Simulate what-if scenarios for energy savings

## ✨ Features

| Feature | Description |
|---------|-------------|
| Dashboard | Summary cards, charts, alerts, weather |
| Buildings & Rooms | Manage buildings and room-wise tracking |
| Appliance Management | Add, view, and monitor appliances |
| Energy Monitoring | Real-time consumption tracking |
| Analytics | Monthly trends, room-wise, day-of-week patterns |
| Appliance Health | Health scoring with deviation-based thresholds |
| Anomaly Detection | Rule-based detection of unusual consumption |
| Predictions | Moving Average + Trend Adjustment (no ML) |
| Recommendations | Data-driven energy saving suggestions |
| Budget Tracking | Monthly budget vs actual spending |
| What-If Simulation | Calculate savings from reducing usage |
| Reports | Daily/monthly reports with top consumers |
| Weather Integration | OpenWeather API for context-aware analysis |
| Settings | Configurable tariff, budget, location |

## 🛠 Technologies Used

| Technology | Purpose |
|------------|--------|
| HTML5 | Page structure |
| CSS3 | Dark theme dashboard styling |
| Vanilla JavaScript | Frontend logic, charts, calculations |
| Chart.js | Bar, line, and doughnut charts |
| Core Java | Backend OOP logic |
| JDBC | Database connectivity |
| MySQL | Data storage |
| OpenWeather API | Weather data integration |

## 📁 Folder Structure

```
SmartEnergySystem/
├── frontend/
│   ├── index.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── buildings.html       # Buildings management
│   ├── rooms.html           # Room-wise tracking
│   ├── appliances.html      # Appliance list
│   ├── monitoring.html      # Real-time monitoring
│   ├── analytics.html       # Analytics & trends
│   ├── health.html          # Appliance health scores
│   ├── anomalies.html       # Anomaly detection
│   ├── predictions.html     # Energy predictions
│   ├── recommendations.html # Smart recommendations
│   ├── budget.html          # Budget tracking
│   ├── simulation.html      # What-If simulation
│   ├── reports.html         # Reports & summaries
│   ├── settings.html        # System settings
│   ├── style.css            # Complete CSS design
│   └── script.js            # All JavaScript logic
├── java/
│   ├── Main.java            # Entry point, demos all features
│   ├── Appliance.java       # Appliance class (Encapsulation)
│   ├── AC.java              # AC subclass (Inheritance)
│   ├── EnergyCalculator.java # Energy & cost calculations
│   ├── EnergyData.java      # Data storage (Collections)
│   ├── Prediction.java      # Moving Average prediction
│   ├── Recommendation.java  # Smart recommendations
│   └── Database.java        # JDBC database operations
├── database/
│   └── schema.sql           # MySQL database schema + demo data
└── README.md
```

## 🚀 How to Run

### Step 1: Install MySQL
1. Download MySQL from https://dev.mysql.com/downloads/installer/
2. Install MySQL Server and MySQL Workbench
3. Set root password during installation

### Step 2: Create Database
1. Open MySQL Workbench or command line
2. Run the schema file:
```sql
source database/schema.sql;
```
Or copy-paste the contents of `schema.sql` into MySQL Workbench and execute.

### Step 3: Configure Database Connection
1. Open `java/Database.java`
2. Update the connection details:
```java
private static final String URL = "jdbc:mysql://localhost:3306/smart_energy";
private static final String USER = "root";
private static final String PASSWORD = "your_password_here";
```

### Step 4: Run Java Program
```powershell
cd SmartEnergySystem/java
javac *.java
java Main
```

### Step 5: Open Frontend
1. Navigate to `SmartEnergySystem/frontend/`
2. Open `index.html` in any web browser
3. Login with: **admin / admin123**
4. You will see the full dashboard

### Step 6: Configure OpenWeather API (Optional)
1. Sign up at https://openweathermap.org/api
2. Get a free API key
3. Go to Settings page in the dashboard
4. Enter the API key
5. If no key is entered, demo weather data is shown

## 🔐 Sample Login

| Username | Password |
|----------|----------|
| admin    | admin123 |

## 📊 Sample Appliances

| Appliance    | Power  | Room        | Expected | Actual |
|-------------|--------|-------------|----------|--------|
| AC           | 1500 W | Living Room | 6 hrs    | 8.5 hrs |
| Refrigerator | 200 W  | Kitchen     | 24 hrs   | 24 hrs  |
| Fan          | 75 W   | Bedroom     | 8 hrs    | 7.5 hrs |
| LED Light    | 12 W   | Study Room  | 6 hrs    | 6.2 hrs |
| TV           | 100 W  | Living Room | 4 hrs    | 5 hrs   |
| Computer     | 250 W  | Study Room  | 6 hrs    | 5.5 hrs |

> **Note:** AC is intentionally set with higher actual hours to demonstrate anomaly detection, health warnings, and recommendations.

## 🧮 Key Formulas

```
Energy (kWh) = Power (Watts) / 1000 × Hours
Cost (₹) = Energy (kWh) × Tariff (₹/kWh)
Deviation (%) = ((Actual - Expected) / Expected) × 100
Predicted = Moving Average(3 months) + (Trend × 0.5)
Efficiency = (Expected / Actual) × 100
```

## 🔧 Common Errors

| Error | Solution |
|-------|----------|
| Charts not showing | Make sure you have internet for Chart.js CDN |
| Login not working | Clear browser localStorage |
| Database error | Check MySQL is running, password is correct |
| JDBC driver not found | Download mysql-connector-j.jar from MySQL website |
| Java compile error | Make sure all .java files are in same folder |
| Weather not loading | API key might be invalid or not entered |

## 📝 OOP Concepts Demonstrated

### 1. Encapsulation
- `Appliance.java` uses `private` variables with `public` getters/setters
- Data validation in setters (e.g., negative power check)

### 2. Inheritance
- `AC` extends `Appliance`
- AC adds weather-related properties and behavior
- Only ONE meaningful subclass (not over-engineered)

### 3. Polymorphism
- `Appliance acRef = new AC(...)` - parent reference to child object
- `calculateActualConsumption()` is overridden in AC class
- Same method call behaves differently based on object type

### 4. Abstraction
- Complex calculations hidden inside methods
- Simple method names like `calculateEnergy()`, `predictNextMonth()`

### 5. Collections
- `ArrayList<Appliance>` - stores list of appliances
- `HashMap<String, Double>` - room-wise consumption mapping
- `ArrayList<String>` - list of recommendations

### 6. Exception Handling
- Negative power validation
- Invalid hours (>24) validation
- Database connection error handling
- Input validation in setters

## 🎓 Viva Explanation

**Q: What does this project do?**
A: It monitors energy consumption of appliances, detects anomalies, predicts future bills, and recommends ways to save energy.

**Q: How does prediction work?**
A: We use Moving Average of last 3 months plus a Trend Adjustment. No machine learning. Simple math.

**Q: How is anomaly detected?**
A: We compare actual vs expected consumption. If deviation exceeds thresholds (10/20/30%), we flag it.

**Q: What is encapsulation here?**
A: Appliance class uses private variables. You can only access them through getters/setters, which include validation.

**Q: Where is inheritance used?**
A: AC class extends Appliance. AC adds weather data and overrides the consumption calculation method.

**Q: Where is polymorphism?**
A: `Appliance ref = new AC(...)` - same Appliance reference calls AC's overridden method.

**Q: What database is used?**
A: MySQL with JDBC. We use PreparedStatement for safe SQL queries.

**Q: How does weather affect the system?**
A: If temperature is >35°C or humidity >80%, AC consumption increase is expected. The system won't flag it as an anomaly.

---

**Built for 2nd Year Engineering OOP Project**
