var React = require('react');

var Main = React.createClass({

    getInitialState: function() {

        return {
            message: "",
            activityChosen: false,
            userMsg: "",
            msgClass: "alert alert-success",
            signedIn: false
        }


    },

    postData: function() {
        var component = this;
        var body;
        var url;


       
        body = {slug: this.props.slug, tip: this.state.data, activity: this.props.activity}
        url = "/api/tips"


        var user = JSON.parse(document.getElementById("user").innerHTML);

          if (user === "none") {
            this.setState({userMsg: "You must be logged in to submit a tip"})
            return;
          }
          else {
            this.setState({signedIn: true})
          }
        

        $.post(url, body, function(data) {
                component.setState({msgClass: "alert alert-success", userMsg: "Great, we received it!"})
                component.props.update();
                $(".single-form .alert").fadeIn("slow")
                setTimeout(function() { 
                    $(".single-form .alert").fadeOut("slow")
                }, 3000);
        });
        
       
    },



    changeData: function(e) {
        this.setState({data: e.target.value})
    },

    showLoginModal: function() {
        var showLoginEvent = new CustomEvent('showLogin');
        window.dispatchEvent(showLoginEvent);   
    },

    componentDidMount: function() {
            this.setState({message: "Add a " + this.props.activity + " tip"})

          var user = JSON.parse(document.getElementById("user").innerHTML);

          if (user === "none") {
            this.setState({userMsg: "You must be logged in to submit a tip", signedIn: false})
            return;
          }
          else {
            this.setState({signedIn: true})
          }
    },
   
    render: function() {    
      
       return (

            <div className="single-form"> 
            <p>{"Add a " + this.props.activity + " tip"}</p>
        
            <textarea value={this.state.data} onChange={this.changeData} className="form-control" />


            <button onClick={this.postData} className="btn main-btn" type="submit">{"Submit " + this.props.activity + " tip"}</button>

            {!this.state.signedIn ? <button onClick={this.showLoginModal} className="btn main-btn">Login Now</button>: null}

            {this.state.userMsg !== "" ?
            <div><p className={this.state.msgClass}>{this.state.userMsg}</p></div>
            : null}

            
            
            </div>
        );
  
  
      }
});

module.exports=Main