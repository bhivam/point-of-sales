## To Do
- Go to a particular restaurant's dash with a slug.
 - It has to be with the context of the user's role in that restaurant. 
 - So, to do this we have to keep the relationship as context and for any action that's done in the restaurant we have to do a role check.
  - This includes taking orders, moving a table, etc. 
- Once we have the restaurant with user context figured out in the frontend I will work on taking actions in the restaurant
 - Inviting staff members to join the restaurant.
  - We should be able to do this via email. (invites table with role, restaurant, staff email?)
  - Idk if i'll setup a smtp service but upon account creation the system will try to link up the staff member with the restaurant and put themin activated status.
 - Creating and editing a menu.
 - Adding and removing tables.
 - Taking orders
  - tableless (to go)
  - with table in mind
 - We should add a set of open and close times for the kitchen that needs to be a subset of the times the restaurant is open. This is so that orders can't be placed during certain sets of time.

