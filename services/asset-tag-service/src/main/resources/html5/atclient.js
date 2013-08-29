/*
 Copyright 2013 Intel Corporation. All rights reserved.

 Dependencies:
 prototype.js
 log.js
 form.js
 rivets.js
 */

/* globals: $, $$, Ajax, Object, TypeError, URI, XMLHttpRequest, document, fakeresource, log, mtwilson, rivets */
/*jslint white: true */

if( mtwilson === undefined ) {
     var mtwilson = {};
}

//var mtwilson = mtwilson || {};
mtwilson.atag = mtwilson.atag || {};
(function () { // start mt wilson asset tag module definition

    // base url
    var uri = new URI(document.location.toString());

    // DATA
    var data;
    var view;
    var options;

    mtwilson.atag.initialize = function (parameters) {
        data = parameters.data || {
            'notices': [], // each has { text:'', clear:'auto' }  (or clear:'confirm' to force user to acknowledge it)  generally generated by the client but (TODO) could be generated by server too!
            'tags': [], // each has { name:'', oid:'', values:[] }
            'selections': [],
            'certificateRequests': [],
            'certificates': [],
            'rdfTriples': [],
            'configurations': [],
            'files':[],
            'currentConfiguration': {}
        };
        log.debug("init data to "+Object.toJSON(data));
        ajax.data = data;
        mtwilson.atag.data = data;
        view = parameters.view || {
            'update': function (data) {
                log.debug("No view to update");
            },
            'sync': function () {
                log.debug("No view to sync");
            }
        };
        mtwilson.atag.view = view;
        ajax.view = view; // after every ajax call the view will be updated ???
        options = parameters.options || {
            'baseurl': (uri.scheme() == 'http' || uri.scheme() == 'https') ? '' : '#' // or http://localhost:8080
        };
        /*
         * VIEWS maps name (tags, requests, certificates, rdf-triples) to view objects.
         * Each view object should have an update(data) function which will be called
         * whenever our data is updated.
         */
//VIEWS = parameters.views || {};
    };


    // configure the ajax framework
    ajax.resources.notices = { uri:'/notices', datapath:'notices', idkey:'uuid' }; // TODO: not implemented on server yet, and when it is imlemented it should be a plugin API like configuration API
    ajax.resources.tags = { uri:'/tags', datapath:'tags', idkey:'uuid' }; // configurations can also use idkey:'oid' and idkey:'name' 
    ajax.resources.rdfTriples = { uri:'/rdf-triples', datapath:'rdfTriples', idkey:'uuid' };
    ajax.resources.certificates = { uri:'/certificates', datapath:'certificates', idkey:'uuid' };
    ajax.resources.certificateRequests = { uri:'/certificate-requests', datapath:'certificateRequests', idkey:'uuid' };
    ajax.resources.selections = { uri:'/selections', datapath:'selections', idkey:'uuid' }; // selections can also use idkey:'name'
    ajax.resources.configurations = { uri:'/configurations', datapath:'configurations', idkey:'uuid' }; // configurations can also use idkey:'name'
    ajax.resources.files = { uri:'/files', datapath:'files', idkey:'uuid' }; // configurations can also use idkey:'name'

//    mtwilson.atag.data = data; 
//    log.debug("again, data = "+Object.toJSON(mtwilson.atag.data));
// UTILITIES

    /**
     * Uses validator.js to validate form input. Conveniently accepts form id, form element, or form child element to identify
     * the form to validate.
     *
     * @param input can be a form id (string), html form element, or any html element inside the form such as a submit button
     * @return an object { validator: Validator, input: input-model, isValid: boolean }
     */
    function validate(input) {
        var formId;
        var validator;
        var model;
        var isValid = false;
        if (typeof input === 'string') {  // the id of a form
            formId = input;
        }
        if (Object.isElement(input) && input.tagName.toLowerCase() == 'form') { // an html form, so use its id
            formId = input.id;
        }
        else if (Object.isElement(input)) { // an html element but not the form... so move up to the enclosing form to get the id
            formId = input.up('form').id;
        }
        model = mtwilson.rivets.forms[ formId ];
        validator = new Validation(formId, {
            useTitles: true,
            immediate: true,
            onSubmit: false
        });
        /*
         if( typeof input === 'object' ) {
         model = input;
         validator = null; // XXX TODO maybe we can use an optional second parameter to identify the form?? or maybe we shouldn'ta ccept obejcts... ??
         }
         */
        if (validator) {
            isValid = validator.validate();
        }
        return {'validator': validator, 'input': model, 'isValid': isValid, 'formId': formId};
    }


    function apiwait(text) {
        $('ajaxstatus').addClassName("wait");
        if (!text) {
            text = "Waiting...";
        }
        if (text) {
            $('ajaxstatus').update(text);
        }
//$('ajaxstatus').show();
    }
    function apidone() {
        //$('ajaxstatus').hide();
        $('ajaxstatus').removeClassName("wait");
        $('ajaxstatus').update("");
    }

    function apiurl(resource) {
        return options.baseurl + /* '/' + */ resource;
    }


    /*
     function view(resource) {
     if( resource in VIEWS ) {
     log.debug("There is a view for resource "+resource);
     if( 'update' in VIEWS[resource] ) {
     log.debug("Found view for "+resource);
     return VIEWS[resource];
     }
     }
     return { 'update': function() { log.debug("No view for resource '"+resource+"'"); } };
     }
     */
// SERVER REPOSITORY HELPER METHODS

    mtwilson.atag.notify = function(notice) {
        log.debug("NOTICE: "+Object.toJSON(notice));
//        mtwilson.atag.data.notices.push(notice); // { text:'...', clear:'auto' }  or clear:'confirm' to force user to acknowledge
 //       view.sync();
        // for now we implement it this way, but in the future it should be part of the data model (data.notices) with automatic confirmations to server when user clicks on a 'confirm' notice to acknowledge it:
//        $('notifications').insert({ bottom: notice.text });
    };

// VIEW API
    document.observe("ajax:httpPostSuccess", function(event) {
        switch(event.memo.resource.name) {
            case 'tags':
                    mtwilson.atag.notify({ text:'Created tag: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', oid:'', values:[]});
                    break;
            case 'rdfTriples':
                    mtwilson.atag.notify({ text:'Created RDF triple: '+event.memo.resource.app.input.subject+' '+event.memo.resource.app.input.predicate+' '+event.memo.resource.app.input.object, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', predicate:'', object:''});
                    break;
            case 'selections':
                    mtwilson.atag.notify({ text:'Created selection: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            case 'certificateRequests':
                    mtwilson.atag.notify({ text:'Created certificate request for: '+event.memo.resource.app.input.subject, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', tags:[]});
                    break;
            case 'configurations':
                    mtwilson.atag.notify({ text:'Created configuration: '+event.memo.resource.app.input.name, clear:'auto' });
                    break;
            case 'files':
                    mtwilson.atag.notify({ text:'Created file: '+event.memo.resource.app.input.name, clear:'auto' });
                    break;
            default:
                log.debug("No handler for successful HTTP POST of "+event.memo.resource.name);
        };
        /*
        if( event.memo.resource.name === 'tags' ) {
            //$('tag-create-form').reset();
            // reset the form's data model, and rivets will automatically update the form GUI. 
            // you CANNOT just set forms['tag-create-form'] = { name:'', oid:'', values:[] } because that will 
            // replace the reference and will cause rivets to lose the connection between the model & the form.
            // (XXX TODO maybe fix this in rivets or in how we configure it)
//            event.memo.resource.app.input.name = ''; //mtwilson.rivets.forms['tag-create-form'].name = ''; 
//            event.memo.resource.app.input.oid = '';//mtwilson.rivets.forms['tag-create-form'].oid = ''; 
//            event.memo.resource.app.input.values = [];//mtwilson.rivets.forms['tag-create-form'].values = []; 
//            event.memo.resource.app.validator.reset();
//            $('tag-create-name').value = '';
//            $('tag-create-oid').value = '';
//            $('tag-create-values').value = '';
        }
                */
    });

    document.observe("ajax:httpDeleteSuccess", function(event) {
        switch(event.memo.resource.name) {
            case 'tags':
                    mtwilson.atag.notify({ text:'Deleted tag: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', oid:'', values:[]});
                    break;
            case 'rdfTriples':
                    mtwilson.atag.notify({ text:'Deleted RDF triple: '+event.memo.resource.app.input.subject+' '+event.memo.resource.app.input.predicate+' '+event.memo.resource.app.input.object, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', predicate:'', object:''});
                    break;
            case 'selections':
                    mtwilson.atag.notify({ text:'Deleted selection: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            case 'certificateRequests':
                    mtwilson.atag.notify({ text:'Deleted certificate request for: '+event.memo.resource.app.input.subject, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', tags:[]});
                    break;
            case 'configurations':
                    mtwilson.atag.notify({ text:'Deleted configuration: '+event.memo.resource.app.input.name, clear:'auto' });
//                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            case 'files':
                    mtwilson.atag.notify({ text:'Deleted file: '+event.memo.resource.app.input.name, clear:'auto' });
//                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            default:
                log.debug("No handler for successful HTTP DELETE of "+event.memo.resource.name);
        };
    });    

    document.observe("ajax:httpPutSuccess", function(event) {
        switch(event.memo.resource.name) {
            case 'tags':
                    mtwilson.atag.notify({ text:'Updated tag: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', oid:'', values:[]});
                    break;
            case 'rdfTriples':
                    mtwilson.atag.notify({ text:'Updated RDF triple: '+event.memo.resource.app.input.subject+' '+event.memo.resource.app.input.predicate+' '+event.memo.resource.app.input.object, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', predicate:'', object:''});
                    break;
            case 'selections':
                    mtwilson.atag.notify({ text:'Updated selection: '+event.memo.resource.app.input.name, clear:'auto' });
                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            case 'certificateRequests':
                    mtwilson.atag.notify({ text:'Updated certificate request for: '+event.memo.resource.app.input.subject, clear:'auto' });
                    event.memo.resource.app.input.merge({subject:'', tags:[]});
                    break;
            case 'configurations':
                    mtwilson.atag.notify({ text:'Updated configuration: '+event.memo.resource.app.input.name, clear:'auto' });
//                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            case 'files':
                    mtwilson.atag.notify({ text:'Updated file: '+event.memo.resource.app.input.name, clear:'auto' });
//                    event.memo.resource.app.input.merge({name:'', subjects:[], tags:[]});
                    break;
            default:
                log.debug("No handler for successful HTTP PUT of "+event.memo.resource.name);
        };
    });    
    
    document.observe("ajax:httpGetSuccess", function(event) {
        switch(event.memo.resource.name) {
            case 'tags':
                    // update various controls that refer to the tags... 
                    selection_create_form_init();  /// TODO:  this control should always have the full list of tags... nto just the search results from the other tab... so maybe instaed of updating it here, we need to make a distinction between a refresh of 'all tags' data and what the search screen asked for.
                    break;
            case 'rdfTriples':
                    break;
            case 'selections':
                    //log.debug("got selections! "+Object.toJSON(event.memo));
//                    automatic-tag-selection-name
                    break;
            case 'certificateRequests':
                    break;
            case 'configurations':
                    if( event.memo.resource.callback ) {
                        event.memo.resource.callback(event.memo);
                    }
                    break;
            case 'files':
                    if( event.memo.resource.callback ) {
                        event.memo.resource.callback(event.memo);
                    }
                    break;
            default:
                log.debug("No handler for successful HTTP GET of "+event.memo.resource.name);
        };
    });    
    
    mtwilson.atag.createTag = function (input) {
        var report = validate(input);
        if (report.isValid) {
            var tagObject = report.input.clone(); // or use report.input.cloneJSON() if it has circular references (it shouldn't!) or another way is Object.toJSON(report.input).evalJSON(); 
            ajax.json.post('tags', [tagObject], {app:report}); // pass {app:report} so it will be passed to the event handler after the request is complete
        }
    };
    
    mtwilson.atag.createSelection = function(input) {
        log.debug("the form model is: "+Object.toJSON(mtwilson.rivets.forms['selection-create-form']));
        var report = validate(input);
        if (report.isValid) {
            log.debug("report input: "+Object.toJSON(report.input));
            // sample post format: {"name":"default","tags":[{"tagName":"state","tagOid":"1.1.1.1","tagValue":"CA"},{"tagName":"city","tagOid":"2.2.2.2","tagValue":"sacramento"}]}
            // when creating selections its the "selection" array of the form data that we submit to the server, together with the name of the selection:
            var selectionObject = { name: $F('selection-create-name'), tags: [] }; // should use report.input.name but it's not being populated 
            var i = report.input.selection.length; // but for tags we need to submit just the uuid & value... not the whole tag
            while(i--) {
                selectionObject.tags.push({tagName:report.input.selection[i].tag.name,tagValue:report.input.selection[i].value});
            }
            log.debug("Posting selection: {}", Object.toJSON(selectionObject));
            ajax.json.post('selections', [selectionObject], {app:report}); // pass {app:report} so it will be passed to the event handler after the request is complete
        }        
    };
    
    mtwilson.atag.createRdfTriple = function (input) {
        var report = validate(input);
        if (report.isValid) {
            var rdfTripleObject = report.input.clone(); //Object.toJSON(report.input).evalJSON();
            ajax.json.post('rdfTriples', [rdfTripleObject], {app:report});
//            view.sync(); //view.update(data);
        }
    };

            // removes all tags with this uuid
    mtwilson.atag.removeRdfTriple = function (uuid) {
        var i;
        for (i = data.rdfTriples.length - 1; i >= 0; i--) {
            if (('uuid' in data.rdfTriples[i]) && data.rdfTriples[i].uuid == uuid) {
                ajax.json.delete('rdfTriples', data.rdfTriples[i]);
                data.rdfTriples.splice(i, 1);  // maybe this should move to the httpDeleteSuccess event listener? 
                //					return;
            }
            //view.sync(); //view.update(data);
        }
        view.sync();
        /*
                for(var i=sampledata.rdfTriples.length-1; i>=0; i--) {
                    if( ('uuid' in sampledata.rdfTriples[i]) && sampledata.rdfTriples[i].uuid == uuid ) {
                        sampledata.rdfTriples.splice(i,1);  // removes just this element...  note it's the first one found, so if you search for something that appears many times, only the first one will be removed!
                        //					return;
                    }				
                    rdfview.update(sampledata);
                }*/
            };
		


    mtwilson.atag.removeFirstTag = function (oid) {
        var i;
        for (i = 0; i < data.tags.length; i--) {
            if (('oid' in data.tags[i]) && data.tags[i].oid == oid) {
                ajax.json.delete('tags', data.tags[i]);
                data.tags.splice(i, 1);  // removes just this element...  note it's the first one found, so if you search for something that appears many times, only the first one will be removed!
                view.sync(); //view.update(data);
                return;
            }
        }
    };

    // removes all tags with this oid
    mtwilson.atag.removeTag = function (uuid) {
        var i;
        for (i = data.tags.length - 1; i >= 0; i--) {
            if (('uuid' in data.tags[i]) && data.tags[i].uuid == uuid) {
                ajax.json.delete('tags', data.tags[i]);
                data.tags.splice(i, 1);  // maybe this should move to the httpDeleteSuccess event listener? 
                //					return;
            }
        }
        view.sync();
    };
    
    // removes all tags with this oid
    mtwilson.atag.removeSelection = function (uuid) {
        var i;
        for (i = data.selections.length - 1; i >= 0; i--) {
            if (('uuid' in data.selections[i]) && data.selections[i].uuid == uuid) {
                ajax.json.delete('selections', data.selections[i]);
                data.selections.splice(i, 1);  // maybe this should move to the httpDeleteSuccess event listener? 
                //					return;
            }
        }
        view.sync();
    };
    
    
    mtwilson.atag.findTagByUuid = function(uuid) {
        var i;
        for (i = data.tags.length - 1; i >= 0; i--) {
            if (('uuid' in data.tags[i]) && data.tags[i].uuid == uuid) {
                return data.tags[i];
            }
        }
    };
    mtwilson.atag.findTagByOid = function(oid) {
        var i;
        for (i = data.tags.length - 1; i >= 0; i--) {
            if (('oid' in data.tags[i]) && data.tags[i].oid == oid) {
                return data.tags[i];
            }
        }
    };


    mtwilson.atag.updateTags = function (tags) {
        data.tags = tags;
    };

    mtwilson.atag.searchTags = function (input) {
        var report = validate(input); // XXX TODO: add an OID validator function ; currently none of the inputs need to be validated
//    if( report.isValid ) { ... }
        // each section of the tag search form looks like "Name [equalTo|contains] [argument]" so to create the search criteria
        // we form parameters like nameEqualTo=argument  or nameContains=argument
        var fields = ['name', 'oid', 'value'];
        var i;
        for (i = 0; i < fields.length; i++) {
            $('tag-search-' + fields[i]).name = fields[i] + $F('tag-search-' + fields[i] + '-criteria'); // this.options[this.selectedIndex].value;
        }
        
        // first clear search results (otherwise the results we get from server will be appended to them)
        data.tags.clear();
//        ajax.json.get('tags', {uri:'/tags?' + $(report.formId).serialize()}); // XXX TODO  serialize the search form controls into url parameters...
        ajax.json.get('tags', $(report.formId).serialize(true)); // pass parameters as object (serialize=true) and no other options (no third argument)
//    apiwait("Searching tags...");
    };
    
    mtwilson.atag.searchRdfTriples = function (input) {
        var report = validate(input); // XXX TODO: add an OID validator function ; currently none of the inputs need to be validated
//    if( report.isValid ) { ... }
        // each section of the tag search form looks like "Name [equalTo|contains] [argument]" so to create the search criteria
        // we form parameters like nameEqualTo=argument  or nameContains=argument
        var fields = ['subject', 'predicate', 'object'];
        var i;
        for (i = 0; i < fields.length; i++) {
            $('rdf-triple-search-' + fields[i]).name = fields[i] + $F('rdf-triple-search-' + fields[i] + '-criteria'); // this.options[this.selectedIndex].value;
        }
        
        // first clear search results (otherwise the results we get from server will be appended to them)
        data.rdfTriples.clear();       
//        ajax.json.get('tags', {uri:'/tags?' + $(report.formId).serialize()}); // XXX TODO  serialize the search form controls into url parameters...
        ajax.json.get('rdfTriples', $(report.formId).serialize(true)); // pass parameters as object (serialize=true) and no other options (no third argument)
//    apiwait("Searching tags...");
    };    
    
    mtwilson.atag.searchSelections = function (input) {
        var report = validate(input); // XXX TODO: add an OID validator function ; currently none of the inputs need to be validated
//    if( report.isValid ) { ... }
        // each section of the tag search form looks like "Name [equalTo|contains] [argument]" so to create the search criteria
        // we form parameters like nameEqualTo=argument  or nameContains=argument
        var fields = ['name', 'tagName', 'tagOid', 'tagValue'];
        var i;
        for (i = 0; i < fields.length; i++) {
            $('selection-search-' + fields[i]).name = fields[i] + $F('selection-search-' + fields[i] + '-criteria'); // this.options[this.selectedIndex].value;
        }
        
        // first clear search results (otherwise the results we get from server will be appended to them)
        data.selections.clear();
//        ajax.json.get('tags', {uri:'/tags?' + $(report.formId).serialize()}); // XXX TODO  serialize the search form controls into url parameters...
        ajax.json.get('selections', $(report.formId).serialize(true)); // pass parameters as object (serialize=true) and no other options (no third argument)
//    apiwait("Searching tags...");
    };
    
    mtwilson.atag.retrieveMainConfiguration = function (eventMemo_not_used) {
//        log.debug("retrieveMainConfiguration searching for main...");
        // we get called after all the configurations are retrieved from the server...
        // currently we really only support one "main" configuration 
        // so find it in the list -- should be the only one there
        var i = data.configurations.length;
        var current = null;
        while(i-- && current === null) {
            if( data.configurations[i].name === 'main' ) {
                current = data.configurations[i];
//                log.debug("found it!");
            }
        }
        data.currentConfiguration.merge(current.jsonContent);
        data.currentConfiguration.selections = mtwilson.atag.data.selections; // need to have the selection choices for the form, but we don't submit all the seelction names, only the one that is chosen
//        log.debug("Current configuration: "+Object.toJSON(data.currentConfiguration));
        view.sync();
//        ajax.json.get('configurations', {nameEqualTo:'main'}, {datapath:'currentConfiguration'}); // pass parameters as object (serialize=true) and no other options (no third argument)
    };    
    
    mtwilson.atag.storeMainConfiguration = function (input) {
//        var report = validate(input);
//        log.debug("storeMainConfiguration validated input (no-op)");
//        if (report.isValid) {
//            log.debug("storeMainConfiguration input is valid");
//            var clone = report.input.clone(); // or use report.input.cloneJSON() if it has circular references (it shouldn't!) or another way is Object.toJSON(report.input).evalJSON(); 
        data.configurations[0].jsonContent.merge(data.currentConfiguration); // TODO: need to select the right configuration to update if we ever support more than one
        var config = data.configurations[0];
        delete config.content; // don't send the text content to the server... send only the jsonContent that we edited, and the server will serialize
        delete config.selections; // don't send the selection data (merged into it in retrieveMainConfiguration)
//        log.debug("modified config: "+Object.toJSON(config));
        ajax.json.put('configurations', config, {app:{input:{name:config.name}}}); // pass {app:report} so it will be passed to the event handler after the request is complete
//        }
    };
    
    
    mtwilson.atag.searchConfigurations = function (input) {
        var report = validate(input); // XXX TODO: add an OID validator function ; currently none of the inputs need to be validated
//    if( report.isValid ) { ... }
        // each section of the tag search form looks like "Name [equalTo|contains] [argument]" so to create the search criteria
        // we form parameters like nameEqualTo=argument  or nameContains=argument
        var fields = ['name', 'contentType'];
        var i;
        for (i = 0; i < fields.length; i++) {
            $('configuration-search-' + fields[i]).name = fields[i] + $F('configuration-search-' + fields[i] + '-criteria'); // this.options[this.selectedIndex].value;
        }
        
        // first clear search results (otherwise the results we get from server will be appended to them)
        data.configurations.clear();
//        log.debug("cleared data tags: "+Object.toJSON(data.tags));
        
//        ajax.json.get('tags', {uri:'/tags?' + $(report.formId).serialize()}); // XXX TODO  serialize the search form controls into url parameters...
        ajax.json.get('configurations', $(report.formId).serialize(true), {callback:mtwilson.atag.retrieveMainConfiguration}); // pass parameters as object (serialize=true) and no other options (no third argument)
//    apiwait("Searching tags...");
    };    
    
    
    mtwilson.atag.loadCaCerts = function(input) {
        ajax.json.get('files', {nameEqualTo:'cacerts'}, {callback:function(eventMemo) {
            var i = data.files.length;
            var current = null;
            while(i-- && current === null) {
                if( data.files[i].name === 'cacerts' ) {
                    current = data.files[i];
//                    log.debug("found it! "+Object.toJSON(current));
                }
            }
            if( current ) {
                $('cacerts-text').update( Base64.decode(current.content) );
            }
//        data.currentConfiguration.merge(current.jsonContent);
//        log.debug("Current configuration: "+Object.toJSON(data.currentConfiguration));
//        view.sync();                
        }}); // pass parameters as object (serialize=true) and no other options (no third argument)
        
    };
    
    /*
     function storeConfigForm() {
     if( !('form' in MHConfig) ) { MHConfig['form'] = {}; }
     var textInputs = $$('form#config-form input[type="text"]');
     var passwordInputs = $$('form#config-form input[type="password"]');
     for(var i=0; i<textInputs.length; i++) {
     MHConfig['form'][ textInputs[i].id ] = textInputs[i].value;
     }
     for(var i=0; i<passwordInputs.length; i++) {
     MHConfig['form'][ passwordInputs[i].id ] = passwordInputs[i].value;
     }
     }

     function fillConfigForm() {
     if( !('form' in MHConfig) ) { return; }
     for(var inputId in MHConfig['form']) {
     try {
     var input = $(inputId);
     if( input.type == "text" || input.type == "password" ) {
     input.value = MHConfig['form'][inputId];
     }
     }
     catch(e) {
     log.warning("Missing configuration input in form: "+e.name+": "+e.message);
     }
     }
     }

     function updateKeyTableView() {
     for(var keyname in MHConfig['dek']) {
     var record = MHConfig['dek'][keyname];
     $$('table#key-table-view tbody')[0].insert({bottom:'<tr><td>'+keyname+'</td><td>AES</td><td>128</td><td>unknown</td><td></td></tr>'});
     }
     }
     */

// given a form model (eg mtwilson.rivets.forms['myform']) check each attribute
// which corresponds to a text input, password input, or textarea, and if its value
// is the same as the default display text (from input.js) then clear the value
// Returns:  a copy of the model (so that when we reset the value to empty string
// it doesn't affect the UI at all
// Example:   { 'attr1':'default value', 'attr2':'user defined', 'attr3':'user defined' }
//   if the 'default value' corresponds to 'data-alt' in <input id='input1' data-bind-value='attr1' data-alt='default value'/>
//   then the returned object would be:
//            { 'attr1':'',  'attr2':'user defined', 'attr3':'user defined' }
    /*  *** NOT NEEDED WHEN YOU USE HTML5 PLACEHOLDER ATTRIBUTES... ***
     function cloneWithoutAltText(model) {
     var clone = {};
     for(var p in model) {
     var els = $$('input[data-bind-value='+p+']','password[data-bind-value='+p+']', 'textarea[data-bind-text='+p+']');
     if( els.length > 0 ) {
     for(var i=0; i<els.length; i++) {
     if( els[i].getAttribute('data-alt') && (els[i].getAttribute('data-alt') == model[p]) ) {
     clone[p] = '';
     }
     else {
     clone[p] = model[p];
     }
     }
     }
     else {
     clone[p] = model[p];
     }
     }
     return clone;
     }
     */


    /*
     * This method accepts either the id of a form or a javascript object with input.
     * If a form id is given, the form is validated and the corresponding rivets model
     * is used as input.
     * If a javascript object is given, at this time we don't validate it because the
     * validation is tied to the form and there's no convenient way to reapply the rules
     * to the object.
     */
    mtwilson.atag.updateCertificateAuthority = function (input) {
        var report = validate(input);
        if (report.isValid) {
            alert("form is valid, update ca: " + Object.toJSON(report.input));
        }
        else {
            alert("form NOT valid, update ca: " + Object.toJSON(report.input));

        }
        //alert("Update CA: "+Object.toJSON(cloneWithoutAltText(input)));
    };



})();  // end mt wilson asset tag module definition


mtwilson.rivets = {};
mtwilson.rivets.forms = {};
mtwilson.rivets.views = {};
document.observe('dom:loaded', function () {
    // find all forms, and automatically create a data object for each one to use in binding
    var forms = $$('form[id]');
    var i, formId;
    for (i = 0; i < forms.length; i++) {
        formId = forms[i].id;
        // create a data object for the form
        mtwilson.rivets.forms[ formId ] = { global: mtwilson.atag.data }; // give every form a link to global data (not included when the form is submitted)
        // use rivets to bind the object to the form
        mtwilson.rivets.views[ formId ] = rivets.bind(forms[i], mtwilson.rivets.forms[formId]);
    }
});

