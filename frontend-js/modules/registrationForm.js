import axios from 'axios'

export default class RegistrationForm {
  
  constructor() {
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.form = document.querySelector("#registration-form")
    this.allFields = document.querySelectorAll("#registration-form .form-control")//returns array of all items with that class
    this.insertValidationElements()
    this.username = document.querySelector("#username-register")
    this.username.previousValue = ""
    this.email = document.querySelector("#email-register")
    this.email.previousValue = []
    this.password = document.querySelector("#password-register")
    this.password.previousValue = []
    this.events() // this calls events 
    this.username.isUnique = false
    this.email.isUnique = false
  }

// Events
  events() {
    this.form.addEventListener("submit", (e)=> {
      e.preventDefault()
      this.formSubmitHandler()
    })
    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
    //blur runs when you exit off of a field or it loses focus
    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
  
  }

// Methods

  formSubmitHandler() {
    this.usernameImmediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmediately()
    this.passwordAfterDelay()
    //This is manually running all validation checks again!

    if(
        this.username.isUnique  &&
        !this.username.errors &&
        this.email.isUnique &&
        !this.email.errors &&
        !this.password.errors
      ) {
      this.form.submit()
    }
  }

  isDifferent(el, handler) {
    if(el.previousValue != el.value) {
      handler.call(this)
      //handler.call(this) instead of handler() makes sure the this keyword remains pointed at our overall object/ RegistrationForm
    }
    el.previousValue = el.value
  }

  usernameHandler() {
    this.username.errors = false
    this.usernameImmediately()
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => {this.usernameAfterDelay()}, 800)
  }

  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => {this.emailAfterDelay()}, 800)
  }

  passwordHandler() {
    this.password.errors = false
    this.passwordImmediately()
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => {this.passwordAfterDelay()}, 800)
  }

  passwordImmediately() {
    if(this.password.value.length > 30) {
      this.showValidationError(this.password, "Password cannot exceed 30 characters")
    }
    if(!this.password.errors) {
      this.hideValidationError(this.password)
    }
  }

  passwordAfterDelay() {
    if(this.password.value.length < 12) {
      this.showValidationError(this.password, "Password must be at least 12 characters")
    }

    if(!/(?=.*[0-9])/.test(this.password.value)) {
      this.showValidationError(this.password, "Password must contain at least one numeric character")
    }

    if(!this.password.errors) {
      this.hideValidationError(this.username)
    }
  }

  emailAfterDelay() {
    if(!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(this.email.value)) {
      this.showValidationError(this.email, "You must provide a valid email address")
    }

    if(!this.email.errors) {
      axios.post('/doesEmailExist', {_csrf: this._csrf, email: this.email.value}).then((response)=>{
        if(response.data) {
          this.email.isUnique = false
          this.showValidationError(this.email, "That email is in use")
        } else {
          this.email.isUnique = true
          this.hideValidationError(this.email)
        }
      }).catch(()=>{
        console.log("Please try again later")
      })
    }
  }

  usernameImmediately() {
    if(this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, "Username can only contain letters and number")
    }

    if(this.username.value.length > 30) {
      this.showValidationError(this.username, "Username cannot exceed 30 characters")
    }

    if(!this.username.errors) {
      this.hideValidationError(this.username)
    }
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message
    el.nextElementSibling.classList.add("liveValidateMessage--visible")
    el.errors = true
  }

  hideValidationError(el) {
    el.nextElementSibling.classList.remove("liveValidateMessage--visible")
  }

  usernameAfterDelay() {
    if(this.username.value.length < 3) {
      this.showValidationError(this.username, "Username must exceed 3 characters")
    }

    if(!this.username.errors) {
      axios.post('/doesUsernameExist', {_csrf: this._csrf, username: this.username.value}).then((response)=>{
        if(response.data) {
          this.showValidationError(this.username, "This username is already taken.")
          this.username.isUnique = false
        } else {
          //username is available
          this.username.isUnique = true
        }
       }).catch(()=>{
        console.log("Please try again later please.")
      })
    }
  }

  insertValidationElements() {
    this.allFields.forEach(function(el) {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  }

}