package com.myapp.model;

import java.util.HashMap;

public class ContentsData {

    private HashMap<String, String> elementMap = null;

    public ContentsData() {
        elementMap = new HashMap<String, String>();
    }

    public HashMap<String, String> getElementMap() {
        return elementMap;
    }

    public void setElementMap(HashMap<String, String> elementMap) {
        this.elementMap = elementMap;
    }

    public String get(String key) {
        if (elementMap != null) {
            return elementMap.get(key);
        }
        return null;
    }

}
