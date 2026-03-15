<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vault_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title_encrypted', 512);   // encrypted in browser
            $table->text('data_encrypted');            // JSON blob encrypted in browser
            $table->string('iv', 64);                  // AES-GCM IV (base64)
            $table->string('category')->default('login'); // login, card, note, etc.
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vault_entries');
    }
};
