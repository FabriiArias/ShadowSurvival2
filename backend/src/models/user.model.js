export default class User {
    constructor({ id = null, username, email, password_hash}){
        this.id = id;
        this.username = username;
        this.email - email;
        this.password_hash = password_hash;
    }
}