package com.myapp.model

class DeviceInfo {

    private var name: String? = null
    private var product: String? = null
    private var usbmdl: String? = null
    private var host: String? = null
    private var port: String? = null
    private var type: String? = null
    private var domain: String? = null
    private var macaddress: String? = null
    private var deviceclass: String? = null
    private var devicestatus: String? = null

    fun getName(): String? {
        return name
    }

    fun setName(name: String?) {
        this.name = name
    }

    fun getProduct(): String? {
        return product
    }

    fun setProduct(product: String?) {
        this.product = product
    }

    fun getUsbmdl(): String? {
        return usbmdl
    }

    fun setUsbmdl(usbmdl: String?) {
        this.usbmdl = usbmdl
    }

    fun getHost(): String? {
        return host
    }

    fun setHost(host: String?) {
        this.host = host
    }

    fun getPort(): String? {
        return port
    }

    fun setPort(port: String?) {
        this.port = port
    }

    fun getType(): String? {
        return type
    }

    fun setType(type: String?) {
        this.type = type
    }

    fun getDomain(): String? {
        return domain
    }

    fun setDomain(domain: String?) {
        this.domain = domain
    }

    fun getMacaddress(): String? {
        return macaddress
    }

    fun setMacaddress(macaddress: String?) {
        this.macaddress = macaddress
    }

    fun getDeviceClass(): String? {
        return deviceclass
    }

    fun setDeviceClass(deviceclass: String?) {
        this.deviceclass = deviceclass
    }

    fun getDeviceStatus(): String? {
        return devicestatus
    }

    fun setDeviceStatus(devicestatus: String?) {
        this.devicestatus = devicestatus
    }

}