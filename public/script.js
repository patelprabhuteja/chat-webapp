try{
    let loginBtn=document.getElementById("login");
    let regBtn=document.getElementById("signup");
    loginBtn.onclick=()=>{
        regBtn.classList.remove("btn-disabled");
        regBtn.classList.add("btn-dark");
        loginBtn.classList.add("btn-disabled");
        loginBtn.classList.remove("btn-dark");
        document.querySelector(".loginWindow").classList.add("active");
        document.querySelector(".regWindow").classList.remove("active");
    }
    regBtn.onclick=()=>{
        loginBtn.classList.remove("btn-disabled");
        loginBtn.classList.add("btn-dark");
        regBtn.classList.add("btn-disabled");
        regBtn.classList.remove("btn-dark");
        document.querySelector(".loginWindow").classList.remove("active");
        document.querySelector(".regWindow").classList.add("active");
    }
}catch(e){}

try{
    let inputs=document.getElementsByClassName("input");
    for(let i=0;i<inputs.length;i++){
        inputs[i].onkeyup=()=>{
            if(inputs[i].value.trim()===""){
                inputs[i].classList.add("is-invalid");
                inputs[i].classList.remove("is-valid");
            }
            else{
                inputs[i].classList.add("is-valid");
                inputs[i].classList.remove("is-invalid");
            }
        }
    }
}catch(e){}

try{
    let showPassBtn=document.getElementById("showPass");
    showPassBtn.onchange=()=>{
        if(showPassBtn.checked){
            document.querySelector("#password").type="text";
        }
        else{
            document.querySelector("#password").type="password";
        }
    }
}catch(e){}