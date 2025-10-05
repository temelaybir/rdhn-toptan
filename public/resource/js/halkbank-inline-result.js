/*!
 * HalkBank Inline Result Handler (Mock)
 * For 3DS iframe bank form processing
 */
(function() {
  "use strict";

  console.log("HalkBank inline result handler loaded");

  // Auto-submit functionality for bank forms
  function autoSubmitForm() {
    console.log("Checking for auto-submit forms...");
    
    // Look for forms that need auto-submission
    var forms = document.querySelectorAll('form[name="returnform"], form[method="post"]');
    
    if (forms.length > 0) {
      var form = forms[0];
      console.log("Bank form found, preparing for submission");
      
      // Small delay before auto-submit to ensure page is fully loaded
      setTimeout(function() {
        console.log("Auto-submitting bank form...");
        
        // Send message to parent before form submission
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'BANK_FORM_SUBMITTING',
              source: 'bank_form'
            }, '*');
          }
        } catch (e) {
          console.log("Could not send message to parent:", e);
        }
        
        // Submit the form
        form.submit();
      }, 500);
    }
  }

  // Handle page load
  function onPageLoad() {
    console.log("Bank page loaded, DOM ready");
    
    // Auto-submit if needed
    autoSubmitForm();
    
    // Monitor for form submissions
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function(e) {
        console.log("Form being submitted:", e.target);
        
        // Notify parent about form submission
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'BANK_FORM_SUBMITTED',
              source: 'bank_form'
            }, '*');
          }
        } catch (err) {
          console.log("Could not notify parent of form submission:", err);
        }
      });
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onPageLoad);
  } else {
    onPageLoad();
  }

  // Also trigger on window load for safety
  window.addEventListener("load", function() {
    console.log("Window fully loaded");
    setTimeout(autoSubmitForm, 100);
  });

  // Handle unload (when navigating away)
  window.addEventListener("beforeunload", function() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'BANK_FORM_UNLOADING',
          source: 'bank_form'
        }, '*');
      }
    } catch (e) {
      console.log("Could not send unload message:", e);
    }
  });

})();