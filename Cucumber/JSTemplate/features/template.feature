Feature: Template Feature

Scenario Outline: Implement Features
    Given you download this template
    When you copied this file to <feature_name>.feature file
    Then you should go to features/step_definitions and copy template.js <feature_name>.js file
