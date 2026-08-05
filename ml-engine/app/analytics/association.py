import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules

class AssociationMiner:
    def mine_rules(self, incidents: list, min_support=0.05, min_confidence=0.3):
        if not incidents:
            return {"rules": []}
            
        df = pd.DataFrame(incidents)
        features = ["weather_condition", "road_surface_condition", "light_condition", "junction_detail", "road_classification"]
        
        present_features = [f for f in features if f in df.columns]

        data = []
        for _, row in df.iterrows():
            itemset = []
            for f in present_features:
                if pd.notna(row[f]):
                    itemset.append(f"{f}={row[f]}")
            factors = row.get('contributing_factors') if 'contributing_factors' in df.columns else None
            if isinstance(factors, (list, tuple, set)):
                for cf in factors:
                    itemset.append(f"factor={cf}")
            data.append(itemset)

        if not any(data):
            return {"rules": []}
            
        # One-hot encode
        unique_items = set(item for itemset in data for item in itemset)
        encoded_data = []
        for itemset in data:
            row_dict = {item: (item in itemset) for item in unique_items}
            encoded_data.append(row_dict)
            
        ohe_df = pd.DataFrame(encoded_data)
        
        frequent_itemsets = fpgrowth(ohe_df, min_support=min_support, use_colnames=True)
        if frequent_itemsets.empty:
            return {"rules": []}
            
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
        
        result = []
        for _, rule in rules.iterrows():
            result.append({
                "antecedent": list(rule['antecedents']),
                "consequent": list(rule['consequents']),
                "support": float(rule['support']),
                "confidence": float(rule['confidence']),
                "lift": float(rule['lift'])
            })
            
        return {"rules": result}
