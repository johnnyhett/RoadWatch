import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules

class AssociationMiner:
    def mine_rules(self, incidents: list, min_support=0.05, min_confidence=0.3):
        if not incidents:
            return {"rules": []}
            
        df = pd.DataFrame(incidents)
        features = ["weather_condition", "road_surface_condition", "light_condition", "junction_detail", "road_classification"]
        
        data = []
        for _, row in df.iterrows():
            itemset = []
            for f in features:
                if pd.notna(row[f]):
                    itemset.append(f"{f}={row[f]}")
            for cf in row.get('contributing_factors', []):
                itemset.append(f"factor={cf}")
            data.append(itemset)
            
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
