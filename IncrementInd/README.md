# Incrementing Number

`User.js` contains a universal incrementer function:

```javascript
function IncrementInd(/**string*/str)
```

This function expects to get a string that ends with a number, such as "Updated Invoice234".

If so, it returns "Updated Invoice235".
 
If string contains no trailing number, the funciton will simply append '1' to the end. I.e. if we pass "Invoice" it would return "Invoice1".

So if we call it with a string 'Invoice' consequently, passing its result back to the function, we will get a sequence:

* Invoice 	=> Invoice1
* Invoice1	=> Invoice2
* Invoice2	=> Invoice3
* ..and so on.

The function also respects padding. So if the number contains leading zeroes, the function will produce the number of the same size, i.e.:

* Project008	=> Project009
* Project009	=> Project010
* ..and so on.

