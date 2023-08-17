<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Planning](#planning)
- [Database](#database)
  - [Database Set Up (Firebase)](#database-set-up-firebase)
    - [Tables & Fields](#tables-fields)
  - [Database Test](#database-test)
- [Project Draft](#project-draft)

<!-- TOC end -->

<!-- TOC --><a name="planning"></a>

# Planning

I'm creating a plan for this app from the architecture, routes/pages, database, styling, and etc.

<!-- TOC --><a name="database"></a>

# Database

<!-- TOC --><a name="database-set-up-firebase"></a>

## Database Set Up (Firebase)

The plan is to have all the data for example inventory in one table, and for the entry we differentiate it with restaurant_id. There are lists of user that we set up using Firebase Security Rules that can access certain data both for write and read.

<!-- TOC --><a name="tables-fields"></a>

### Tables & Fields

Restaurants:

- id (integer, primary key)
- name (string)
- address (string)
- userID (integer, foreign key to users.id)
- createdAt (timestamp)
- updatedAt (timestamp)

Users:

- id (integer, primary key)
- email (string)
- password (string)
- restaurantIDs (array of integers, foreign key to restaurants.id)
- createdAt (timestamp)
- updatedAt (timestamp)

Inventories:

- id (integer, primary key)
- restaurantID (integer, foreign key to restaurants.id)
- itemName (string)
- quantity (integer)
- minQuantity (integer)
- price (integer or string)
- warning(boolean)
- createdAt (timestamp)
- updatedAt (timestamp)

inventoriesLogs:

- id (integer Primary key)
- userID (integer ID of the user who made the change)
- date (timestamp Date and time of the change)
- restaurantID (integer ID of the restaurant)
- inventoryID (integer ID of the inventory item)
- inventoryPrice (string)
- dailyStockBefore (integer Quantity of the inventory item before the change)
- dailyStockAddition (integer Quantity of the addition of the stock that day)
- dailyStockUsed (integer Quantity of the inventory item that was used)
- dailyStockDamagedOrLost (integer Quantity of the inventory item that was damaged)
- totalDailyStockUsed (integer total of dailyStockUsed and dailyStockDamagedOrLost)
- totalDailyStockUsedValue (string total of dailyStockUsed and dailyStockDamagedOrLost in currency)
- stockAfter (integer Quantity of the inventory item after changes (dailyStockBefore + dailyStockAddition - totalDailyStockUsed))
- ipAddress (string)
- createdAt (timestamp)
- updatedAt (timestamp)

cashFlows:

- id (integer Primary key)
- cash (string) => use decimal.js to work with this calculation
- allDailyStockedUsedValue => string ==> should we have this? Or just calculate it manually from the logs.
- restaurantID (integer ID of the restaurant)
- createdAt (timestamp)
- updatedAt (timestamp)

cashFlowsLogs

- id (integer Primary key)
- userID (integer ID of the user who made the change)
- date (timestamp Date and time of the change)
- restaurantID (integer ID of the restaurant)
- cashFlowsID (integer of ID of cashFlows)
- inventoryLogsID (array of integers, foreign key to inventoryLogs) ==> should we have this?
- cashBefore (string)
- totalSales (string)
- totalOnlineSales (string)
- totalExpenses (string)
- cashDifference (string)
- cashAfter (string)
- ipAddress (string)
- createdAt (timestamp)
- updatedAt (timestamp)

Authorization rules:

- Only user that is authenticated & linked with the restaurants can Read & write for the restaurant and also the inventories.
- Other users that are not authenticated and also linked with restaurants can't see inventories table and also restaurant table

Code snippet:

```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",

    "restaurants": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('restaurant_ids').child(data.child('id').val()).exists()",
      ".write": "auth != null && root.child('users').child(auth.uid).child('restaurant_ids').child(data.child('id').val()).exists()"
    },

    "inventories": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('restaurant_ids').child(data.child('restaurant_id').val()).exists()",
      ".write": "auth != null && root.child('users').child(auth.uid).child('restaurant_ids').child(data.child('restaurant_id').val()).exists()"
    }
  }
}
```

<!-- TOC --><a name="database-test"></a>

## Database Test

Testing Firebase in React Environment using Jest? Should I find it out how? before moving to the next stage.

<!-- TOC --><a name="project-draft"></a>

# Project Draft

- User's Flow? (TODO)
- Routes/Pages
  - Sign In
  - Input inventory changes
  - View Current inventory
  - View inventory changes
  - Input cash flow
  - view cash flow logs
- Feature?
  - Sign In
  - Create User by Admin (users can't create the account by themselves)
  - Input Stock
    - A page that lists all the inventory, and for each inventory users can add changes and there's a button to save the value into a state
    - After the users done, then the users can click review to move to the next page to review all the products
    - If the users are okay, then users click submit to record the stock changes. If the users are not okay then can click `back` to go back to the previous page.
  - Alert to the users, if the quantity of the inventory is equal or below minQuantity. The alerts is gone if the quantity is already above the minQuantity
  - Multiple languages
