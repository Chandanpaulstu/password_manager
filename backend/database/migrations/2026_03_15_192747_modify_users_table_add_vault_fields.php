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
        Schema::table('users', function (Blueprint $table) {
            $table->string('password_hint')->nullable()->after('password');
            $table->string('kdf_salt', 64)->nullable()->after('password_hint'); // for PBKDF2
            $table->timestamp('last_login_at')->nullable()->after('kdf_salt');
            $table->integer('failed_attempts')->default(0)->after('last_login_at');
            $table->timestamp('locked_until')->nullable()->after('failed_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password_hint','kdf_salt','last_login_at','failed_attempts','locked_until']);
        });
    }
};
