<?php
class Adm_Map
{
    public function get_map()
    {
        ob_start();

        $geojsonUrl = plugin_dir_url(__FILE__) . 'js/gemeente_2025.geojson';
        $ajaxurl    = admin_url('admin-ajax.php');
        $scriptUrl  = plugin_dir_url(__FILE__) . 'js/adm_map.js';
        ?>
<link href="https://fonts.googleapis.com/css2?family=SasaPro:wght@400;700&family=SansPro:wght@400&display=swap"
    rel="stylesheet">
<div class="parent">
    <div class="header">
        <h2 id="header-title">Antidiscriminatiemonitor 2025</h2>
    </div>

    <div class="map" id="grond-map"></div>

    <div class="sidebar" id="sidebar">
        <h3>Gronden voor discriminatie</h3>
        <div id="grond-list"></div>
        <div id="grond-pie" style="width:100%;height:200px;margin-top:10px;"></div>
        <div id="grond-legenda" style="margin-top:10px;"></div>
        <div id="grond-schaal" style="margin-top:15px;"></div>
    </div>
</div>

<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/maps/modules/map.js"></script>

<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/maps/modules/accessibility.js"></script>

<script>
const geojsonUrl = "<?= esc_url($geojsonUrl) ?>";
const ajaxurl = "<?= esc_url($ajaxurl) ?>";
</script>

<script src="<?= esc_url($scriptUrl) ?>"></script>

<?php

        return ob_get_clean();
    }
}