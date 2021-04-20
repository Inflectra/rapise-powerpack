Feature: Template Feauture

Scenario Outline: Implement Features
    Given you download this template
    When you copied this fiel to <feature_name>.feature file
    Then you should go to features/step_definitions and copy template.js <feature_name>.js file
    And  you should go to features/step_definitions and copy template.rvl.xlsx to <feature_name>.rvl.xlsx