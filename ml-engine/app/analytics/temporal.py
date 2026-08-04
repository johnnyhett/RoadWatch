import pandas as pd

class TemporalAnalyzer:
    def analyze(self, incidents: list):
        if not incidents:
            return {}
            
        df = pd.DataFrame(incidents)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        
        hourly_counts = df['hour'].value_counts().sort_index()
        hourly_distribution = [{"hour": int(h), "count": int(c)} for h, c in hourly_counts.items()]
        
        daily_counts = df['day_of_week'].value_counts().sort_index()
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        daily_distribution = [{"day": days[d], "count": int(c)} for d, c in daily_counts.items()]
        
        # Risk multipliers (relative to average hourly count)
        avg_hourly = hourly_counts.mean()
        risk_multipliers = {f"hour_{int(h)}": float(c / avg_hourly) for h, c in hourly_counts.items()}
        
        avg_daily = daily_counts.mean()
        for d, c in daily_counts.items():
            risk_multipliers[f"day_{days[d]}"] = float(c / avg_daily)
            
        return {
            "hourly_distribution": hourly_distribution,
            "daily_distribution": daily_distribution,
            "risk_multipliers": risk_multipliers
        }
