package com.taprs.domain.model;

import java.util.List;

public record AssociationRule(
    List<String> antecedent,
    List<String> consequent,
    double support,
    double confidence,
    double lift
) {}
