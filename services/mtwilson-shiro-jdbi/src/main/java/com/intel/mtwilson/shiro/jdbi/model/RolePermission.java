/*
 * Copyright (C) 2014 Intel Corporation
 * All rights reserved.
 */
package com.intel.mtwilson.shiro.jdbi.model;

import com.intel.dcsg.cpg.io.UUID;

/**
  role_id uuid NOT NULL,
  permit_domain character varying(200) DEFAULT NULL,
  permit_action character varying(200) DEFAULT NULL,
  permit_selection character varying(200) DEFAULT NULL,
 *
 * @author jbuhacoff
 */
public class RolePermission {
    private UUID roleId;
    private String permitDomain;
    private String permitAction;
    private String permitSelection;

    public UUID getRoleId() {
        return roleId;
    }

    public void setRoleId(UUID roleId) {
        this.roleId = roleId;
    }

    public String getPermitDomain() {
        return permitDomain;
    }

    public void setPermitDomain(String permitDomain) {
        this.permitDomain = permitDomain;
    }

    public String getPermitAction() {
        return permitAction;
    }

    public void setPermitAction(String permitAction) {
        this.permitAction = permitAction;
    }

    public String getPermitSelection() {
        return permitSelection;
    }

    public void setPermitSelection(String permitSelection) {
        this.permitSelection = permitSelection;
    }
    
    
}