<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Planning](#planning)
- [Database](#database)
  - [Database Set Up (Firebase)](#database-set-up-firebase)
    - [Tables & Fields](#tables-fields)
    - [Authorization rules](#authorization-rules)
  - [Database Test](#database-test)
- [Project Draft](#project-draft)

<!-- TOC end -->

<!-- TOC --><a name="planning"></a>

# Planning

I'm creating a plan for this app from the architecture, routes/pages, database, styling, and etc.

Working On:
k

- Redux or just Reducer?
  This app doesn't need Redux at all. However, for the learning purpose, I decided to go with Redux.
  - 🏃‍♂️ Success Case: Listen to auth change and store 7it to the Reducer.
  - 🏃‍♂️ Checking the auth when the app starts and save it to the Reducer.
  - 🏃‍♂️Redirection after successful Sign In (But Later on after the reducer.)
- 📝 Pages/Routes:

  - 📝 Authentication
  - 📝 AdminCreateUser
  - 📝 AdminUpdateUser
  - 📝 AdminDeleteUser
  - 📝 AdminAssignRestaurantIDs

- Admin Page: Create User, Update User, Set RestaurantIDs to a user

- App Layout

To Do List:

- 📝 Restaurant Collection skeleton
- 📝 Restaurant & User Relationship + Permission
- 📝 Restaurant Collection helper Functions: CRUD functionality. Functions + Test
- And many more

Done List:

- ✅ Basic Styling:
  - ✅ Font: https://fonts.google.com/specimen/Poiret+One
  - ✅ Inspiration: Background and Sign In Effect: https://reactjsexample.com/responsive-glassmorphism-login-page-with-react/
- ✅ Button
- ✅ Loading
- ✅ FormInput
- ✅ TextLogo
- ✅ SignIn

  - Interaction:
    - ✅ Showing & Hiding Spinner + showing & hiding "Sign In" text in the button before and after API Request
    - ✅ Disabling & Enabling Submit Button before and after API Request
    - ✅ Error Case: Showing Error: Validation Error, Authentication Failure, the red border on the field.
    - ✅ Error Case: Error Validation & Red Border gone if the user type something on the field
    - ✅ Error Case: auth error gone when the user type something.
    - ✅ Success Case: Hide the Sign In Form & Show redirection.
  - Internationalization

    - ✅ LanguageSelector.component
    - ✅ Set Up Internationalization
    - ✅ Label Input form & Header
    - ✅ Validation Error & Auth Error
    - ✅Success Message

- ✅ Test and add CRUD functionality for User Collections helper Functions:
  - ✅ create & test the `deleteUserDocument` function
  - ✅ Create & Test the `updateUserRestaurantIds` function.
  - ✅ Create & Test the `updateUserDocument` function.
  - ✅ Create & Test the `getUser` function.
  - ✅ Create & Test the `getAllUsers` function.
- ✅ Firebase Emulator set up with Jest.
- ✅ Firebase Auth Helper Functions. All functions are tested.
- ✅ User Collection Permission: set up admin user.

Parking Lot:

<!-- TOC --><a name="database"></a>

# Database

<!-- TOC --><a name="database-set-up-firebase"></a>

## Database Set Up (Firebase)

The plan is to have all the data for example inventory in one table, and for the entry we differentiate it with restaurant_id. There are lists of user that we set up using Firebase Security Rules that can access certain data both for write and read.

<!-- TOC --><a name="tables-fields"></a>

### Tables & Fields

Collection ID: Users:

- Document ID: user.uid (string, primary key)
- Field:
  - email (string)
  - displayName (string)
  - restaurantIDs (array of integers, foreign key to restaurants.id)
  - type (strings , 'admin' or 'user')
  - createdAt (timestamp)
  - updatedAt (timestamp)

Restaurants:

- id (integer, primary key)
- name (string)
- address (string)
- userID (integer, foreign key to users.id)
- createdAt (timestamp)
- updatedAt (timestamp)

Inventories:

- id (integer, primary key)
- restaurantID (integer, foreign key to restaurants.id)
- itemName (string)
- quantity (integer)
- minQuantity (integer)
- unit (string)
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

<!-- TOC --><a name="authorization-rules"></a>

### Authorization rules

> Permissions:
>
> ---
>
> **Users Collection**
>
> - Only authenticated user with custom claims: {"role": "admin"} can create users, read and write all users.
> - Allow users to read only their own document.

<!-- TOC --><a name="database-test"></a>

## Database Test

✅ Testing Firebase in React Environment using Jest? Should I find it out how? before moving to the next stage.
Several Options:

- Mocking the Firebase implementation
- ✅Using [Firebase Emulator] (https://firebase.google.com/docs/emulator-suite) (I'm going with this)

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
